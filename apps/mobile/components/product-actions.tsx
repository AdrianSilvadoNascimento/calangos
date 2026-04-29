import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useUpdateProduct } from '../hooks/use-update-product';
import { useDeleteProduct } from '../hooks/use-delete-product';
import type { ProductData } from '../hooks/use-products';
import { useDialog } from './ui/dialog';
import { reportError } from '../lib/report-error';

type Mode = 'menu' | 'edit' | 'delete-confirm';

interface ProductActionsProps {
  product: ProductData;
  visible: boolean;
  onClose: () => void;
}

export function ProductActions({ product, visible, onClose }: ProductActionsProps) {
  const [mode, setMode] = useState<Mode>('menu');
  const [title, setTitle] = useState(product.title ?? '');
  const [url, setUrl] = useState(product.url);
  const dialog = useDialog();

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Reset state whenever the dialog opens for a (potentially) new product.
  useEffect(() => {
    if (visible) {
      setMode('menu');
      setTitle(product.title ?? '');
      setUrl(product.url);
    }
  }, [visible, product.id, product.title, product.url]);

  const handleClose = () => {
    if (updateProduct.isPending || deleteProduct.isPending) return;
    onClose();
  };

  const handleSaveEdit = async () => {
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();
    if (!trimmedUrl) {
      await dialog.alert({ title: 'Link obrigatório', message: 'O link do produto não pode ficar vazio.' });
      return;
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      await dialog.alert({ title: 'Link inválido', message: 'O link precisa começar com http:// ou https://' });
      return;
    }

    const dto: { title?: string; url?: string } = {};
    if (trimmedTitle !== (product.title ?? '')) dto.title = trimmedTitle;
    if (trimmedUrl !== product.url) dto.url = trimmedUrl;

    if (Object.keys(dto).length === 0) {
      onClose();
      return;
    }

    try {
      await updateProduct.mutateAsync({ id: product.id, dto });
      onClose();
    } catch (err: any) {
      reportError(err, { action: 'product.update' });
      await dialog.alert({
        title: 'Erro',
        message: err?.response?.data?.message ?? 'Não foi possível salvar as alterações.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProduct.mutateAsync(product.id);
      onClose();
    } catch (err: any) {
      reportError(err, { action: 'product.delete' });
      await dialog.alert({
        title: 'Erro',
        message: err?.response?.data?.message ?? 'Não foi possível excluir o item.',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <Pressable
          className="flex-1 bg-black/70 items-center justify-center px-6"
          onPress={handleClose}
        >
          {/* Stop propagation so taps inside the card don't close the modal. */}
          <Pressable
            onPress={() => undefined}
            className="w-full max-w-sm bg-surface-900 rounded-3xl border border-surface-700 overflow-hidden"
          >
            {mode === 'menu' && (
              <MenuPanel
                product={product}
                onEdit={() => setMode('edit')}
                onDelete={() => setMode('delete-confirm')}
                onCancel={handleClose}
              />
            )}

            {mode === 'edit' && (
              <EditPanel
                title={title}
                url={url}
                onTitleChange={setTitle}
                onUrlChange={setUrl}
                onSave={handleSaveEdit}
                onBack={() => setMode('menu')}
                saving={updateProduct.isPending}
              />
            )}

            {mode === 'delete-confirm' && (
              <DeleteConfirmPanel
                productLabel={product.title || product.storeName || 'este item'}
                onConfirm={handleConfirmDelete}
                onCancel={() => setMode('menu')}
                deleting={deleteProduct.isPending}
              />
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Menu (action sheet) ──────────────────────────────────────
function MenuPanel({
  product,
  onEdit,
  onDelete,
  onCancel,
}: {
  product: ProductData;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const label = product.title || product.storeName || 'Produto sem título';
  return (
    <View>
      <View className="px-6 pt-6 pb-4 border-b border-surface-800">
        <Text className="text-white font-semibold text-base" numberOfLines={2}>
          {label}
        </Text>
        <Text className="text-surface-500 text-xs mt-1" numberOfLines={1}>
          {product.url}
        </Text>
      </View>

      <Pressable
        className="px-6 py-4 flex-row items-center active:bg-surface-800"
        onPress={onEdit}
      >
        <Pencil size={18} color="#4ade80" />
        <Text className="text-white font-semibold text-base ml-3">Editar</Text>
      </Pressable>

      <View className="h-px bg-surface-800 mx-6" />

      <Pressable
        className="px-6 py-4 flex-row items-center active:bg-surface-800"
        onPress={onDelete}
      >
        <Trash2 size={18} color="#f87171" />
        <Text className="text-red-400 font-semibold text-base ml-3">Excluir</Text>
      </Pressable>

      <View className="h-px bg-surface-800" />

      <Pressable
        className="px-6 py-4 items-center active:bg-surface-800"
        onPress={onCancel}
      >
        <Text className="text-surface-400 font-semibold text-base">Cancelar</Text>
      </Pressable>
    </View>
  );
}

// ── Edit form ────────────────────────────────────────────────
function EditPanel({
  title,
  url,
  onTitleChange,
  onUrlChange,
  onSave,
  onBack,
  saving,
}: {
  title: string;
  url: string;
  onTitleChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <View className="px-6 pt-6 pb-6">
      <Text className="text-white font-bold text-lg mb-5">Editar item</Text>

      <Text className="text-surface-300 text-sm mb-1.5 ml-1">Nome</Text>
      <TextInput
        className="bg-surface-800 text-white rounded-xl px-4 py-3 text-base mb-4"
        placeholder="Nome do item"
        placeholderTextColor="#4a7055"
        value={title}
        onChangeText={onTitleChange}
        autoCapitalize="sentences"
      />

      <Text className="text-surface-300 text-sm mb-1.5 ml-1">Link</Text>
      <TextInput
        className="bg-surface-800 text-white rounded-xl px-4 py-3 text-base mb-6"
        placeholder="https://..."
        placeholderTextColor="#4a7055"
        value={url}
        onChangeText={onUrlChange}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        multiline
      />

      <Pressable
        className="w-full bg-primary-600 rounded-2xl py-3.5 items-center active:bg-primary-700"
        onPress={onSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Salvar</Text>
        )}
      </Pressable>

      <Pressable className="w-full py-3 items-center mt-1" onPress={onBack} disabled={saving}>
        <Text className="text-surface-400 font-semibold">Cancelar</Text>
      </Pressable>
    </View>
  );
}

// ── Delete confirmation ──────────────────────────────────────
function DeleteConfirmPanel({
  productLabel,
  onConfirm,
  onCancel,
  deleting,
}: {
  productLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <View className="px-6 pt-6 pb-6">
      <Text className="text-white font-bold text-lg mb-2">Excluir item?</Text>
      <Text className="text-surface-400 text-sm mb-6">
        Tem certeza que deseja excluir{' '}
        <Text className="text-white font-semibold">{productLabel}</Text>? Essa ação
        não pode ser desfeita.
      </Text>

      <Pressable
        className="w-full bg-red-600 rounded-2xl py-3.5 items-center active:bg-red-700"
        onPress={onConfirm}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Excluir</Text>
        )}
      </Pressable>

      <Pressable
        className="w-full py-3 items-center mt-1"
        onPress={onCancel}
        disabled={deleting}
      >
        <Text className="text-surface-400 font-semibold">Cancelar</Text>
      </Pressable>
    </View>
  );
}
