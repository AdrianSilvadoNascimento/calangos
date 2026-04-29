import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type ButtonVariant = 'primary' | 'destructive' | 'cancel';

type DialogButton = {
  label: string;
  variant: ButtonVariant;
  onPress: () => void;
};

type DialogConfig = {
  title: string;
  message?: string;
  buttons: DialogButton[];
  dismissOnBackdrop: boolean;
};

export type AlertOptions = {
  title: string;
  message?: string;
  okText?: string;
};

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export type DialogApi = {
  alert: (opts: AlertOptions) => Promise<void>;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used inside <DialogProvider>');
  }
  return ctx;
}

const CLOSE_ANIMATION_MS = 120;

export function DialogProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<DialogConfig | null>(null);
  const queueRef = useRef<DialogConfig[]>([]);
  const isShowingRef = useRef(false);

  const present = useCallback((config: DialogConfig) => {
    if (isShowingRef.current) {
      queueRef.current.push(config);
      return;
    }
    isShowingRef.current = true;
    setCurrent(config);
  }, []);

  const dismiss = useCallback(() => {
    isShowingRef.current = false;
    setCurrent(null);
    // Allow the close animation to play before opening the next one.
    setTimeout(() => {
      if (queueRef.current.length === 0) return;
      const next = queueRef.current.shift()!;
      isShowingRef.current = true;
      setCurrent(next);
    }, CLOSE_ANIMATION_MS);
  }, []);

  const alert = useCallback<DialogApi['alert']>(
    (opts) =>
      new Promise<void>((resolve) => {
        present({
          title: opts.title,
          message: opts.message,
          dismissOnBackdrop: true,
          buttons: [
            {
              label: opts.okText ?? 'OK',
              variant: 'primary',
              onPress: () => {
                dismiss();
                resolve();
              },
            },
          ],
        });
      }),
    [present, dismiss],
  );

  const confirm = useCallback<DialogApi['confirm']>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        present({
          title: opts.title,
          message: opts.message,
          dismissOnBackdrop: !opts.destructive,
          buttons: [
            {
              label: opts.confirmText ?? 'Confirmar',
              variant: opts.destructive ? 'destructive' : 'primary',
              onPress: () => {
                dismiss();
                resolve(true);
              },
            },
            {
              label: opts.cancelText ?? 'Cancelar',
              variant: 'cancel',
              onPress: () => {
                dismiss();
                resolve(false);
              },
            },
          ],
        });
      }),
    [present, dismiss],
  );

  const api = useMemo<DialogApi>(() => ({ alert, confirm }), [alert, confirm]);

  const handleBackdropPress = () => {
    if (current?.dismissOnBackdrop) dismiss();
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={!!current}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleBackdropPress}
      >
        <Pressable
          className="flex-1 bg-black/70 items-center justify-center px-8"
          onPress={handleBackdropPress}
        >
          <Pressable
            onPress={() => undefined}
            className="w-full max-w-sm bg-surface-900 rounded-3xl border border-surface-700 overflow-hidden"
          >
            {current ? <DialogBody config={current} /> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

function DialogBody({ config }: { config: DialogConfig }) {
  return (
    <View>
      <View className="px-6 pt-6 pb-2">
        <Text className="text-white font-bold text-lg mb-2">{config.title}</Text>
        {config.message ? (
          <Text className="text-surface-300 text-sm leading-5">{config.message}</Text>
        ) : null}
      </View>

      <View className="px-6 pt-4 pb-6">
        {config.buttons.map((btn, i) => (
          <DialogButtonView key={`${btn.variant}-${i}`} button={btn} index={i} />
        ))}
      </View>
    </View>
  );
}

function DialogButtonView({ button, index }: { button: DialogButton; index: number }) {
  if (button.variant === 'cancel') {
    return (
      <Pressable
        className={`w-full py-3 items-center ${index > 0 ? 'mt-1' : ''}`}
        onPress={button.onPress}
      >
        <Text className="text-surface-400 font-semibold">{button.label}</Text>
      </Pressable>
    );
  }

  const bg =
    button.variant === 'destructive'
      ? 'bg-red-600 active:bg-red-700'
      : 'bg-primary-600 active:bg-primary-700';

  return (
    <Pressable
      className={`w-full rounded-2xl py-3.5 items-center ${bg} ${index > 0 ? 'mt-2' : ''}`}
      onPress={button.onPress}
    >
      <Text className="text-white font-semibold text-base">{button.label}</Text>
    </Pressable>
  );
}
