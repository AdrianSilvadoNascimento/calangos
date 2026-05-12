import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useUpdateProduct } from '../hooks/use-update-product';
import { useDeleteProduct } from '../hooks/use-delete-product';
import type { ProductData } from '../hooks/use-products';
import { reportError } from '../lib/report-error';
import {
  Button,
  Icon,
  Input,
  Sheet,
  SheetDivider,
  useDialog,
  type IconName,
} from './ui';

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
  const [storeName, setStoreName] = useState(product.storeName ?? '');
  const [description, setDescription] = useState(product.description ?? '');
  const [changingStatus, setChangingStatus] = useState(false);
  const dialog = useDialog();

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  useEffect(() => {
    if (visible) {
      setMode('menu');
      setTitle(product.title ?? '');
      setUrl(product.url);
      setStoreName(product.storeName ?? '');
      setDescription(product.description ?? '');
      setChangingStatus(false);
    }
  }, [visible, product.id, product.title, product.url, product.storeName, product.description]);

  const busy = updateProduct.isPending || deleteProduct.isPending || changingStatus;

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const handleStatusChange = async (newStatus: ProductData['status']) => {
    if (newStatus === product.status) return;
    setChangingStatus(true);
    try {
      await updateProduct.mutateAsync({ id: product.id, dto: { status: newStatus } });
      onClose();
    } catch (err: any) {
      reportError(err, { action: 'product.changeStatus' });
      await dialog.alert({
        title: 'Ops, não rolou',
        message: err?.response?.data?.message ?? 'Não foi possível alterar o status.',
      });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSaveEdit = async () => {
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();
    const trimmedStore = storeName.trim();
    const trimmedDescription = description.trim();
    if (!trimmedUrl) {
      await dialog.alert({ title: 'Link obrigatório', message: 'O link do produto não pode ficar vazio.' });
      return;
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      await dialog.alert({ title: 'Link inválido', message: 'O link precisa começar com http:// ou https://' });
      return;
    }

    const dto: { title?: string; url?: string; storeName?: string; description?: string } = {};
    if (trimmedTitle !== (product.title ?? '')) dto.title = trimmedTitle;
    if (trimmedUrl !== product.url) dto.url = trimmedUrl;
    if (trimmedStore !== (product.storeName ?? '')) dto.storeName = trimmedStore;
    if (trimmedDescription !== (product.description ?? '')) dto.description = trimmedDescription;

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
        title: 'Ops, não rolou',
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
        title: 'Ops, não rolou',
        message: err?.response?.data?.message ?? 'Não foi possível excluir o item.',
      });
    }
  };

  return (
    <Sheet
      open={visible}
      onClose={handleClose}
      dismissable={!busy}
      title={
        mode === 'edit'
          ? 'Editar item'
          : mode === 'delete-confirm'
            ? 'Excluir item?'
            : product.title || product.storeName || 'Produto sem título'
      }
      scrollable={mode === 'edit'}
    >
      {mode === 'menu' && (
        <MenuPanel
          product={product}
          onEdit={() => setMode('edit')}
          onDelete={() => setMode('delete-confirm')}
          onStatusChange={handleStatusChange}
          changingStatus={changingStatus}
        />
      )}

      {mode === 'edit' && (
        <EditPanel
          imageUrl={product.imageUrl}
          title={title}
          url={url}
          storeName={storeName}
          description={description}
          onTitleChange={setTitle}
          onUrlChange={setUrl}
          onStoreNameChange={setStoreName}
          onDescriptionChange={setDescription}
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
    </Sheet>
  );
}

// ── Status options ───────────────────────────────────────────
const STATUS_OPTIONS: {
  key: ProductData['status'];
  label: string;
  icon: IconName;
  color: string;
}[] = [
  { key: 'wishlist',  label: 'Desejado',  icon: 'star',          color: '#E89784' },
  { key: 'purchased', label: 'Comprado',  icon: 'shopping-cart', color: '#7FB6D9' },
  { key: 'received',  label: 'Recebido',  icon: 'package-check', color: '#5FCB8B' },
  { key: 'cancelled', label: 'Cancelado', icon: 'x-circle',      color: '#E0746A' },
];

// ── Menu (action sheet) ──────────────────────────────────────
function MenuPanel({
  product,
  onEdit,
  onDelete,
  onStatusChange,
  changingStatus,
}: {
  product: ProductData;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ProductData['status']) => void;
  changingStatus: boolean;
}) {
  const availableStatuses = STATUS_OPTIONS.filter((s) => s.key !== product.status);

  return (
    <View>
      <Text className="text-ink-3 text-xs mb-3 font-mono" numberOfLines={1}>
        {product.url}
      </Text>

      {/* Status group (DESIGN_SYSTEM §6 + HI-FI §42) */}
      {availableStatuses.map((option) => (
        <Pressable
          key={option.key}
          className="flex-row items-center py-3 active:opacity-70"
          style={{ gap: 12 }}
          onPress={() => onStatusChange(option.key)}
          disabled={changingStatus}
        >
          <Icon name={option.icon} color={option.color} size={20} />
          <Text className="text-ink-1 font-semibold text-base">
            Marcar como {option.label}
          </Text>
        </Pressable>
      ))}

      <SheetDivider />

      {/* Utility group */}
      <Pressable
        className="flex-row items-center py-3 active:opacity-70"
        style={{ gap: 12 }}
        onPress={onEdit}
        disabled={changingStatus}
      >
        <Icon name="pencil" tone="brand" size={20} outline />
        <Text className="text-ink-1 font-semibold text-base">Editar</Text>
      </Pressable>

      <SheetDivider />

      {/* Destructive group */}
      <Pressable
        className="flex-row items-center py-3 active:opacity-70"
        style={{ gap: 12 }}
        onPress={onDelete}
        disabled={changingStatus}
      >
        <Icon name="trash" tone="danger" size={20} outline />
        <Text className="text-danger font-semibold text-base">Excluir</Text>
      </Pressable>
    </View>
  );
}

// ── Edit form ────────────────────────────────────────────────
function EditPanel({
  imageUrl,
  title,
  url,
  storeName,
  description,
  onTitleChange,
  onUrlChange,
  onStoreNameChange,
  onDescriptionChange,
  onSave,
  onBack,
  saving,
}: {
  imageUrl: string | null;
  title: string;
  url: string;
  storeName: string;
  description: string;
  onTitleChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onStoreNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <View>
      {imageUrl && (
        <View className="mb-5 items-center">
          <View
            className="rounded-2xl overflow-hidden border border-line-1"
            style={{ width: 160, height: 160, backgroundColor: '#18372C' }}
          >
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <Text className="text-ink-4 text-xs mt-2">
            Foto vem do link — não dá pra editar por aqui
          </Text>
        </View>
      )}

      <View className="mb-4">
        <Input
          label="Nome"
          placeholder="Nome do item"
          value={title}
          onChangeText={onTitleChange}
          autoCapitalize="sentences"
        />
      </View>

      <View className="mb-4">
        <Input
          label="Loja"
          leftIcon="store"
          placeholder="Ex.: Shopee, Amazon, Mercado Livre"
          value={storeName}
          onChangeText={onStoreNameChange}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View className="mb-4">
        <Input
          label="Descrição"
          placeholder="Pra que serve, tamanho, observações…"
          value={description}
          onChangeText={onDescriptionChange}
          multiline
          minHeight={100}
          autoCapitalize="sentences"
        />
      </View>

      <View className="mb-6">
        <Input
          label="Link"
          leftIcon="link"
          placeholder="https://..."
          value={url}
          onChangeText={onUrlChange}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      <Button label="Salvar item" onPress={onSave} loading={saving} />
      <View className="mt-2">
        <Button label="Cancelar" variant="ghost" onPress={onBack} disabled={saving} />
      </View>
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
    <View>
      <Text className="text-ink-2 text-sm mb-6">
        Tem certeza que deseja excluir{' '}
        <Text className="text-ink-1 font-semibold">{productLabel}</Text>? Essa ação não pode
        ser desfeita.
      </Text>

      <Button
        label="Excluir"
        variant="danger-ghost"
        leftIcon="trash"
        onPress={onConfirm}
        loading={deleting}
      />
      <View className="mt-2">
        <Button label="Cancelar" variant="ghost" onPress={onCancel} disabled={deleting} />
      </View>
    </View>
  );
}
