import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { authClient } from '@enxoval/auth-client';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) return;
    setLoading(true);
    const { error } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('Erro ao criar conta', error.message ?? 'Tente novamente.');
      return;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View className="px-8 py-8">
      <Text className="text-3xl font-bold text-white mb-2">Criar conta</Text>
      <Text className="text-surface-400 mb-8">Comece a organizar seu enxoval</Text>

      <View className="mb-4">
        <Text className="text-surface-300 text-sm mb-1.5 ml-1">Nome</Text>
        <TextInput
          className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
          placeholder="Seu nome"
          placeholderTextColor="#4a7055"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View className="mb-4">
        <Text className="text-surface-300 text-sm mb-1.5 ml-1">E-mail</Text>
        <TextInput
          className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
          placeholder="seu@email.com"
          placeholderTextColor="#4a7055"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View className="mb-8">
        <Text className="text-surface-300 text-sm mb-1.5 ml-1">Senha</Text>
        <TextInput
          className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base"
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor="#4a7055"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <Pressable
        className="w-full bg-primary-600 rounded-2xl py-4 items-center mb-4 active:bg-primary-700"
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Criar conta</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/sign-in')}>
        <Text className="text-surface-400 text-center">
          Já tem conta? <Text className="text-primary-400 font-semibold">Entrar</Text>
        </Text>
      </Pressable>
    </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
