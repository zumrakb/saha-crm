import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SMART_PDF_DARK, uiStyles } from './theme';

interface InlineGlobalSearchProps {
  visible: boolean;
  onClose: () => void;
  query: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  showNoResults?: boolean;
  noResultsLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const InlineGlobalSearch: React.FC<InlineGlobalSearchProps> = ({
  visible,
  onClose,
  query,
  onChangeText,
  placeholder,
  showNoResults = false,
  noResultsLabel,
  style,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput | null>(null);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);

      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      const timerId = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);

      return () => clearTimeout(timerId);
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsRendered(false);
      }
    });

    return undefined;
  }, [progress, visible]);

  if (!isRendered) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <View className="gap-2">
        <View
          className="flex-row items-center gap-3 rounded-[16px] px-4"
          style={uiStyles.searchContainer}
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={SMART_PDF_DARK.muted}
          />

          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={onChangeText}
            placeholder={placeholder ?? t('common.pageSearchPlaceholder')}
            placeholderTextColor={SMART_PDF_DARK.muted}
            className="flex-1 py-0 text-[14px]"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            underlineColorAndroid="transparent"
            selectionColor={SMART_PDF_DARK.accent}
            style={uiStyles.titleText}
          />

          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              onClose();
            }}
            activeOpacity={0.75}
          >
            <Ionicons
              name="close-circle"
              size={17}
              color={SMART_PDF_DARK.muted}
            />
          </TouchableOpacity>
        </View>

        {showNoResults ? (
          <Text
            className="px-2 text-[12px]"
            style={{ color: SMART_PDF_DARK.muted }}
          >
            {noResultsLabel ?? t('common.searchNoResults')}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
};

export default InlineGlobalSearch;
