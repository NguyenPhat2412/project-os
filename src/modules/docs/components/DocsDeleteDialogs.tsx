import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';

interface DocsDeleteDialogsProps {
  confirmDeleteDocName: string | null;
  confirmDeleteWikiTitle: string | null;
  onCancelDocDelete: () => void;
  onCancelWikiDelete: () => void;
  onConfirmDocDelete: () => Promise<void> | void;
  onConfirmWikiDelete: () => Promise<void> | void;
}

export function DocsDeleteDialogs({ confirmDeleteDocName, confirmDeleteWikiTitle, onCancelDocDelete, onCancelWikiDelete, onConfirmDocDelete, onConfirmWikiDelete }: DocsDeleteDialogsProps) {
  return (
    <>
      {confirmDeleteDocName && (
        <ConfirmDialog danger title='Xoá tài liệu' message={`Bạn có chắc muốn xoá "${confirmDeleteDocName}"? Hành động này không thể hoàn tác.`} confirmLabel='Xoá tài liệu' onCancel={onCancelDocDelete} onConfirm={onConfirmDocDelete} />
      )}

      {confirmDeleteWikiTitle && (
        <ConfirmDialog danger title='Xoá Wiki' message={`Bạn có chắc muốn xoá "${confirmDeleteWikiTitle}"? Hành động này không thể hoàn tác.`} confirmLabel='Xoá Wiki' onCancel={onCancelWikiDelete} onConfirm={onConfirmWikiDelete} />
      )}
    </>
  );
}
