import { create } from 'zustand';
import type { Term } from '../constants/term.types';
import {
  getAllTerms,
  getTermsByCustomer,
  insertTerm,
  updateTerm,
  updateTermStatus,
  updateTermStage,
  type TermWriteInput,
} from '../repositories/term.repository';
import type { TermStatus } from '../constants/termStatus';
import {
  cancelTermReminder,
  scheduleTermReminder,
} from '../services/termNotifications';

interface TermStore {
  terms: Term[];
  isLoading: boolean;
  error: string | null;
  activeCustomerId: number | null;
  load: () => void;
  loadByCustomer: (customerId: number) => void;
  add: (data: TermWriteInput) => Promise<number | null>;
  update: (termId: number, data: TermWriteInput) => Promise<boolean>;
  updateStatus: (
    termId: number,
    customerId: number,
    status: TermStatus,
  ) => Promise<void>;
  updateStage: (termId: number, stage: Term['stage']) => Promise<boolean>;
}

export const useTermStore = create<TermStore>(set => ({
  terms: [],
  isLoading: false,
  error: null,
  activeCustomerId: null,
  load: () => {
    set({
      isLoading: true,
      error: null,
      activeCustomerId: null,
    });

    try {
      const terms = getAllTerms();
      set({ terms, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load terms.',
      });
    }
  },
  loadByCustomer: customerId => {
    set({
      isLoading: true,
      error: null,
      activeCustomerId: customerId,
    });

    try {
      const terms = getTermsByCustomer(customerId);
      set({ terms, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load terms.',
      });
    }
  },
  add: async data => {
    try {
      const termId = insertTerm(data);

      set(state => {
        const terms =
          state.activeCustomerId !== null
            ? getTermsByCustomer(state.activeCustomerId)
            : getAllTerms();

        return {
          terms,
          error: null,
        };
      });

      if (termId) {
        await scheduleTermReminder({
          ...data,
          id: termId,
          createdAt: new Date().toISOString(),
        });
      }

      return termId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add term.',
      });

      return null;
    }
  },
  update: async (termId, data) => {
    try {
      updateTerm(termId, data);

      set(state => {
        const terms =
          state.activeCustomerId !== null
            ? getTermsByCustomer(state.activeCustomerId)
            : getAllTerms();

        return {
          terms,
          error: null,
        };
      });

      await scheduleTermReminder({
        ...data,
        id: termId,
        createdAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update term.',
      });

      return false;
    }
  },
  updateStatus: async (termId, customerId, status) => {
    try {
      updateTermStatus(termId, customerId, status);

      let nextTerms: Term[] = [];

      set(state => {
        nextTerms =
          state.activeCustomerId !== null
            ? getTermsByCustomer(state.activeCustomerId)
            : getAllTerms();

        return {
          terms: nextTerms,
          error: null,
        };
      });

      const updatedTerm = nextTerms.find(term => term.id === termId);

      if (updatedTerm) {
        await scheduleTermReminder(updatedTerm);
      } else {
        await cancelTermReminder(termId);
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update term.',
      });
    }
  },
  updateStage: async (termId, stage) => {
    try {
      updateTermStage(termId, stage);

      set(state => {
        const terms =
          state.activeCustomerId !== null
            ? getTermsByCustomer(state.activeCustomerId)
            : getAllTerms();

        return {
          terms,
          error: null,
        };
      });

      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update stage.',
      });
      return false;
    }
  },
}));
