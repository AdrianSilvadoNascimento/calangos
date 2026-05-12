import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { cn } from '../../lib/cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** When set, renders the title row with a close button. */
  title?: string;
  /** Disable backdrop close (e.g. while saving). Default false. */
  dismissable?: boolean;
  /** Use ScrollView around children. Default true. */
  scrollable?: boolean;
  children: ReactNode;
}

/**
 * Bottom Sheet primitive — DESIGN_SYSTEM §6.Bottom Sheet.
 * - Radius 28 top, padding 14/18/22, bg-bg-1
 * - Handle 38×4 line-2, centered
 * - Backdrop radial-ish fade (50%-70%)
 * - Backdrop tap closes (unless dismissable=false)
 */
export function Sheet({
  open,
  onClose,
  title,
  dismissable = true,
  scrollable = true,
  children,
}: SheetProps) {
  const handleBackdrop = () => {
    if (dismissable) onClose();
  };

  const Body = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleBackdrop}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Pressable
          className="flex-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.62)' }}
          onPress={handleBackdrop}
        />
        <View
          className="bg-bg-1 border-t border-line-2"
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: 22,
            // Cap the sheet so tall content scrolls instead of pushing buttons
            // off-screen (the Modal root keeps the area below this stable).
            maxHeight: '88%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -30 },
            shadowOpacity: 0.4,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          {/* Handle */}
          <View className="self-center mb-4" style={{ width: 38, height: 4, borderRadius: 999, backgroundColor: '#294A39' }} />

          {title && (
            <Text className="text-ink-1 text-xl font-bold mb-5" style={{ letterSpacing: -0.3 }}>
              {title}
            </Text>
          )}

          <Body
            {...(scrollable
              ? {
                  showsVerticalScrollIndicator: false,
                  keyboardShouldPersistTaps: 'handled' as const,
                  style: { flexShrink: 1 },
                  contentContainerStyle: { paddingBottom: 8 },
                }
              : {})}
          >
            {children}
          </Body>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Visual divider used between groups inside a Sheet. */
export function SheetDivider({ className }: { className?: string }) {
  return <View className={cn('h-px bg-line-1 my-2', className)} />;
}
