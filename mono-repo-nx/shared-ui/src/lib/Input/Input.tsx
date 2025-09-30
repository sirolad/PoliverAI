import React, { useState } from 'react';
import { TextInput, View, Text, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  inputStyle,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const containerStyle: ViewStyle = {
    marginBottom: 16,
    ...style,
  };

  const labelStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  };

  const inputContainerStyle: ViewStyle = {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
    borderColor: error ? '#EF4444' : isFocused ? '#3B82F6' : '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
  };

  const textInputStyle: TextStyle = {
    fontSize: 16,
    color: disabled ? '#9CA3AF' : '#111827',
    flex: 1,
    ...inputStyle,
  };

  const errorStyle: TextStyle = {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  };

  const eyeButtonStyle: ViewStyle = {
    padding: 4,
    marginLeft: 8,
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}
      <View style={inputContainerStyle}>
        <TextInput
          style={textInputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={eyeButtonStyle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={{ color: '#6B7280', fontSize: 12 }}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
};