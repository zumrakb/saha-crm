import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SMART_PDF_DARK, uiStyles } from './theme';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  disableKeyboardAvoiding?: boolean;
}

const CLOSE_THRESHOLD = 96;

const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  children,
  sheetStyle,
  disableKeyboardAvoiding = false,
}) => {
  const insets = useSafeAreaInsets();
  const [isRendered, setIsRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(320)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 18,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!isRendered) {
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 320,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsRendered(false);
      }
    });
  }, [backdropOpacity, isRendered, translateY, visible]);

  const resetPosition = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_event, gestureState) => {
          translateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dy > CLOSE_THRESHOLD || gestureState.vy > 1.2) {
            onClose();
            return;
          }

          resetPosition();
        },
        onPanResponderTerminate: resetPosition,
      }),
    [onClose, resetPosition, translateY],
  );

  const sheetContent = (
    <Animated.View
      className="rounded-t-[32px]"
      style={[
        uiStyles.modalSheetCompact,
        {
          overflow: 'hidden',
          width: '100%',
          alignSelf: 'stretch',
          transform: [{ translateY }],
        },
        sheetStyle,
      ]}
      {...panResponder.panHandlers}
    >
      <View
        className="px-5 pt-3"
        style={[
          {
            backgroundColor: SMART_PDF_DARK.surface,
            paddingBottom: Math.max(insets.bottom, 16) + 14,
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 16, bottom: 16, left: 32, right: 32 }}
          className="mb-5 self-center"
        >
          <View
            style={[
              uiStyles.modalHandle,
              { height: 4, width: 40, borderRadius: 2 },
            ]}
          />
        </Pressable>
        {children}
      </View>
    </Animated.View>
  );

  return (
    <Modal
      animationType="fade"
      visible={isRendered}
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        pointerEvents="box-none"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: backdropOpacity,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: SMART_PDF_DARK.backdrop,
            }}
          />
        </Animated.View>

        {disableKeyboardAvoiding ? (
          sheetContent
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            {sheetContent}
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
};

export default BottomSheetModal;
