import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod/v3';
import AppButton from '../components/ui/AppButton';
import AppDateField, {
  type AppDateFieldHandle,
} from '../components/ui/AppDateField';
import BottomSheetModal from '../components/ui/BottomSheetModal';
import {
  SMART_PDF_DARK,
  TEXT_INPUT_CLASSNAME,
  uiStyles,
} from '../components/ui/theme';
import { ACTIVITY_TYPE } from '../constants/activityTypes';
import { TERM_STATUS } from '../constants/termStatus';
import type { Term } from '../constants/term.types';
import { useActivityStore } from '../store/activity.store';
import { useCustomerStore } from '../store/customer.store';
import { useTermStore } from '../store/term.store';
import { createZodResolver } from '../utils/createZodResolver';
import { parseISODate, todayISO } from '../utils/dateUtils';

interface NewTermModalProps {
  visible: boolean;
  customerId?: number;
  initialDate?: string;
  term?: Term | null;
  onClose: () => void;
}

interface FormValues {
  customerId: number;
  productName: string;
  orderDate: string;
  expectedDate: string;
  note: string;
  // --- YENİ ALANLAR ---
  price: string; // Formda text olarak tutup dönüştüreceğiz
  currency: string;
  stage: Term['stage'];
}

function getDefaultValues(
  customerId?: number,
  initialDate?: string,
  term?: Term | null,
): FormValues {
  const today = initialDate ?? todayISO();

  return {
    customerId: term?.customerId ?? customerId ?? 0,
    productName: term?.productName ?? '',
    orderDate: term?.orderDate ?? today,
    expectedDate: term?.expectedDate ?? today,
    note: '',
    // --- YENİ ALANLAR DEFAULT ---
    price: term?.price ? term.price.toString() : '',
    currency: term?.currency ?? 'TRY',
    stage: term?.stage ?? 'firsat',
  };
}

function getTermDurationLabel(
  orderDate: string,
  expectedDate: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const order = parseISODate(orderDate);
  const expected = parseISODate(expectedDate);
  const dayDiff = Math.max(
    0,
    Math.round((expected.getTime() - order.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (dayDiff === 0) {
    return t('newTerm.duration.sameDay');
  }

  if (dayDiff === 1) {
    return t('newTerm.duration.oneDay');
  }

  return t('newTerm.duration.multipleDays', { count: dayDiff });
}

const NewTermModal: React.FC<NewTermModalProps> = ({
  visible,
  customerId,
  initialDate,
  term = null,
  onClose,
}) => {
  const { t } = useTranslation();
  const addTerm = useTermStore(state => state.add);
  const updateTerm = useTermStore(state => state.update);
  const addActivity = useActivityStore(state => state.add);
  const customers = useCustomerStore(state => state.customers);
  const loadCustomers = useCustomerStore(state => state.load);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const orderDateFieldRef = useRef<AppDateFieldHandle | null>(null);
  const expectedDateFieldRef = useRef<AppDateFieldHandle | null>(null);
  const noteInputRef = useRef<TextInput | null>(null);
  const priceInputRef = useRef<TextInput | null>(null);

  const STAGE_OPTIONS: { value: Term['stage']; label: string }[] = [
    { value: 'firsat', label: 'Fırsat' }, // t('newTerm.stages.firsat') eklenebilir
    { value: 'teklif_verildi', label: 'Teklif Verildi' },
    { value: 'kazanildi', label: 'Kazanıldı' },
    { value: 'kaybedildi', label: 'Kaybedildi' },
  ];

  const CURRENCY_OPTIONS = ['TRY', 'USD', 'EUR'];

  const schema = useMemo(
    () =>
      z
        .object({
          customerId: z
            .number({
              required_error: t('newTerm.validation.customerId'),
              invalid_type_error: t('newTerm.validation.customerId'),
            })
            .int()
            .positive(t('newTerm.validation.customerId')),
          productName: z
            .string()
            .trim()
            .min(1, t('newTerm.validation.productName')),
          orderDate: z
            .string()
            .trim()
            .regex(/^\d{4}-\d{2}-\d{2}$/, t('newTerm.validation.orderDate')),
          expectedDate: z
            .string()
            .trim()
            .regex(/^\d{4}-\d{2}-\d{2}$/, t('newTerm.validation.expectedDate')),
          note: z.string().trim(),
          // --- YENİ ALANLAR VALIDASYON ---
          price: z.string().trim(), // Boş bırakılabilir, parse ederken 0 yaparız
          currency: z.string().trim(),
          stage: z.enum([
            'firsat',
            'teklif_verildi',
            'kazanildi',
            'kaybedildi',
          ] as const),
        })
        .refine(
          values =>
            parseISODate(values.expectedDate).getTime() >=
            parseISODate(values.orderDate).getTime(),
          {
            message: t('newTerm.validation.expectedDateAfterOrder'),
            path: ['expectedDate'],
          },
        ),
    [t],
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: getDefaultValues(customerId, initialDate, term),
    resolver: createZodResolver(schema),
  });

  const orderDate = watch('orderDate');
  const selectedCustomerId = watch('customerId');
  const selectedStage = watch('stage');
  const selectedCurrency = watch('currency');

  useEffect(() => {
    if (visible && customerId === undefined) {
      loadCustomers();
    }
  }, [customerId, loadCustomers, visible]);

  useEffect(() => {
    reset(getDefaultValues(customerId, initialDate, term));
  }, [customerId, initialDate, reset, term, visible]);

  const closeModal = () => {
    reset(getDefaultValues(customerId, initialDate, term));
    setSubmitError(null);
    onClose();
  };

  const onSubmit = handleSubmit(async values => {
    setSubmitError(null);

    if (values.customerId <= 0) {
      setSubmitError(t('newTerm.submitError'));
      return;
    }

    const numericPrice = parseFloat(values.price.replace(',', '.')) || 0;

    const payload = {
      customerId: values.customerId,
      productName: values.productName.trim(),
      orderDate: values.orderDate.trim(),
      termDuration: getTermDurationLabel(
        values.orderDate.trim(),
        values.expectedDate.trim(),
        t,
      ),
      expectedDate: values.expectedDate.trim(),
      status: term?.status ?? TERM_STATUS.PENDING,
      arrivedAt: term?.status === TERM_STATUS.ARRIVED ? term.arrivedAt : null,
      // --- YENİ EKLENEN FINANSAL VERİLER ---
      price: numericPrice,
      currency: values.currency,
      stage: values.stage,
    };

    if (term) {
      const isUpdated = await updateTerm(term.id, payload);

      if (!isUpdated) {
        setSubmitError(t('newTerm.submitError'));
        return;
      }
    } else {
      const termId = await addTerm(payload);

      if (!termId) {
        setSubmitError(t('newTerm.submitError'));
        return;
      }

      addActivity({
        customerId: values.customerId,
        date: values.orderDate.trim(),
        type: ACTIVITY_TYPE.TERM_ADDED,
        note: values.note.trim() || values.productName.trim(),
        relatedTermId: termId,
      });
    }

    closeModal();
  });

  return (
    <BottomSheetModal visible={visible} onClose={closeModal}>
      <View className="flex-col gap-4" style={{ flexShrink: 1 }}>
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className="text-[22px] font-semibold tracking-[-0.4px]"
            style={uiStyles.titleText}
          >
            {term ? t('newTerm.editTitle') : t('newTerm.title')}
          </Text>

          <AppButton
            label={t('common.cancel')}
            onPress={closeModal}
            variant="pill"
            compact
            iconOnly
            iconName="close"
            style={uiStyles.borderless}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flexShrink: 1 }}
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          <View className="flex-col gap-4">
            {customerId === undefined ? (
              <View className="flex-col gap-2">
                <Text
                  className="text-sm font-semibold"
                  style={uiStyles.titleText}
                >
                  {t('newTerm.fields.customer')}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {customers.map(customer => {
                    const isSelected = selectedCustomerId === customer.id;

                    return (
                      <TouchableOpacity
                        key={customer.id}
                        onPress={() =>
                          setValue('customerId', customer.id, {
                            shouldValidate: true,
                          })
                        }
                        activeOpacity={0.85}
                        className="rounded-full px-4 py-2.5"
                        style={
                          isSelected
                            ? uiStyles.accentSurface
                            : uiStyles.mutedSurface
                        }
                      >
                        <Text
                          className="text-sm font-medium"
                          style={
                            isSelected ? uiStyles.titleText : uiStyles.bodyText
                          }
                        >
                          {customer.companyName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.customerId ? (
                  <Text className="text-sm" style={uiStyles.errorText}>
                    {errors.customerId.message}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <Controller
              control={control}
              name="productName"
              render={({ field: { onBlur, onChange, value } }) => (
                <View className="flex-col gap-2">
                  <Text
                    className="text-sm font-semibold"
                    style={uiStyles.titleText}
                  >
                    {t('newTerm.fields.productName')}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    returnKeyType="next"
                    onSubmitEditing={() => priceInputRef.current?.focus()}
                    placeholder={t('newTerm.placeholders.productName')}
                    placeholderTextColor={SMART_PDF_DARK.muted}
                    underlineColorAndroid="transparent"
                    selectionColor={SMART_PDF_DARK.accent}
                    className={TEXT_INPUT_CLASSNAME}
                    style={[
                      uiStyles.inputBase,
                      errors.productName ? uiStyles.inputError : null,
                    ]}
                  />
                  {errors.productName ? (
                    <Text className="text-sm" style={uiStyles.errorText}>
                      {errors.productName.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            {/* --- YENİ ALAN: FİYAT VE PARA BİRİMİ --- */}
            <View className="flex-row gap-3">
              <View className="flex-1 flex-col gap-2">
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <View className="flex-col gap-2">
                      <Text
                        className="text-sm font-semibold"
                        style={uiStyles.titleText}
                      >
                        Tutar (İsteğe Bağlı) {/* t('newTerm.fields.price') */}
                      </Text>
                      <TextInput
                        ref={priceInputRef}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          orderDateFieldRef.current?.openPicker()
                        }
                        placeholder="Örn: 1500"
                        placeholderTextColor={SMART_PDF_DARK.muted}
                        underlineColorAndroid="transparent"
                        selectionColor={SMART_PDF_DARK.accent}
                        className={TEXT_INPUT_CLASSNAME}
                        style={uiStyles.inputBase}
                      />
                    </View>
                  )}
                />
              </View>

              <View className="flex-col gap-2">
                <Text
                  className="text-sm font-semibold"
                  style={uiStyles.titleText}
                >
                  Para Birimi
                </Text>
                <View className="flex-row gap-1">
                  {CURRENCY_OPTIONS.map(currency => {
                    const isSelected = selectedCurrency === currency;
                    return (
                      <TouchableOpacity
                        key={currency}
                        onPress={() => setValue('currency', currency)}
                        activeOpacity={0.85}
                        className="rounded-xl px-3 py-3"
                        style={
                          isSelected
                            ? uiStyles.accentSurface
                            : uiStyles.mutedSurface
                        }
                      >
                        <Text
                          className="text-sm font-medium"
                          style={
                            isSelected ? uiStyles.titleText : uiStyles.bodyText
                          }
                        >
                          {currency}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* --- YENİ ALAN: SATIŞ AŞAMASI --- */}
            <View className="flex-col gap-2 pt-1 pb-1">
              <Text
                className="text-sm font-semibold"
                style={uiStyles.titleText}
              >
                Satış Aşaması
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {STAGE_OPTIONS.map(stage => {
                  const isSelected = selectedStage === stage.value;
                  return (
                    <TouchableOpacity
                      key={stage.value}
                      onPress={() => setValue('stage', stage.value)}
                      activeOpacity={0.85}
                      className="rounded-full px-4 py-2"
                      style={
                        isSelected
                          ? uiStyles.accentSurface
                          : uiStyles.mutedSurface
                      }
                    >
                      <Text
                        className="text-sm font-medium"
                        style={
                          isSelected ? uiStyles.titleText : uiStyles.bodyText
                        }
                      >
                        {stage.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <Controller
              control={control}
              name="orderDate"
              render={({ field: { onChange, value } }) => (
                <AppDateField
                  ref={orderDateFieldRef}
                  label={t('newTerm.fields.orderDate')}
                  value={value}
                  onChange={onChange}
                  onChangeComplete={() =>
                    expectedDateFieldRef.current?.openPicker()
                  }
                  maximumDate={new Date()}
                  error={errors.orderDate?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="expectedDate"
              render={({ field: { onChange, value } }) => (
                <AppDateField
                  ref={expectedDateFieldRef}
                  label={t('newTerm.fields.expectedDate')}
                  value={value}
                  onChange={onChange}
                  onChangeComplete={() => noteInputRef.current?.focus()}
                  minimumDate={parseISODate(orderDate)}
                  error={errors.expectedDate?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="note"
              render={({ field: { onBlur, onChange, value } }) => (
                <View className="flex-col gap-2">
                  <Text
                    className="text-sm font-semibold"
                    style={uiStyles.titleText}
                  >
                    {t('newTerm.fields.note')}
                  </Text>
                  <TextInput
                    ref={noteInputRef}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                    placeholder={t('newTerm.placeholders.note')}
                    placeholderTextColor={SMART_PDF_DARK.muted}
                    multiline
                    textAlignVertical="top"
                    underlineColorAndroid="transparent"
                    selectionColor={SMART_PDF_DARK.accent}
                    className={TEXT_INPUT_CLASSNAME}
                    style={uiStyles.textArea}
                  />
                </View>
              )}
            />

            {submitError ? (
              <Text className="text-sm" style={uiStyles.errorText}>
                {submitError}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <View className="pt-4">
          <AppButton
            label={
              isSubmitting
                ? t('newTerm.submitting')
                : term
                ? t('newTerm.editSubmit')
                : t('newTerm.submit')
            }
            onPress={onSubmit}
            variant="primary"
            disabled={isSubmitting}
            fullWidth
          />
        </View>
      </View>
    </BottomSheetModal>
  );
};

export default NewTermModal;
