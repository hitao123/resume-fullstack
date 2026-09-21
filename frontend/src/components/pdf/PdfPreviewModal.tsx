import { Modal, Spin } from 'antd';

interface PdfPreviewModalProps {
  open: boolean;
  title: string;
  url?: string;
  loading?: boolean;
  onClose: () => void;
}

export const PdfPreviewModal = ({ open, title, url, loading, onClose }: PdfPreviewModalProps) => (
  <Modal open={open} onCancel={onClose} footer={null} width="min(1000px, 94vw)" title={title} destroyOnClose>
    {loading && <div style={{ minHeight: 420, display: 'grid', placeItems: 'center' }}><Spin /></div>}
    {!loading && url && <iframe title="Resume PDF preview" src={url} style={{ width: '100%', height: '72vh', border: 0 }} />}
  </Modal>
);

export default PdfPreviewModal;
