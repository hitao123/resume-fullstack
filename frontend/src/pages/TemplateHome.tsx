import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Col,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { AppstoreOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PrintDocument from '@/components/pdf/PrintDocument';
import RoleTemplateThumbnail from '@/components/templates/RoleTemplateThumbnail';
import { ROLE_TEMPLATES, getRoleContent, type RoleCategory, type RoleTemplate } from '@/data/roleTemplates';
import { buildPreviewResume, createResumeFromRoleTemplate } from '@/services/roleTemplateService';
import { useResumeStore } from '@/store/resumeStore';
import { getErrorMessage } from '@/utils/apiError';
import { TEMPLATE_NAME_KEYS } from '@/utils/constants';
import { openUpgradePrompt } from '@/utils/planMessages';
import './TemplateHome.css';

const { Title, Paragraph, Text } = Typography;

const CATEGORY_OPTIONS: Array<{ value: 'all' | RoleCategory; labelKey: string }> = [
  { value: 'all', labelKey: 'home.categories.all' },
  { value: 'engineering', labelKey: 'home.categories.engineering' },
  { value: 'ai', labelKey: 'home.categories.ai' },
  { value: 'manufacturing', labelKey: 'home.categories.manufacturing' },
  { value: 'business', labelKey: 'home.categories.business' },
];

export const TemplateHome = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { resumes, isLoading, fetchResumes, createResume } = useResumeStore();
  const [category, setCategory] = useState<'all' | RoleCategory>('all');
  const [preview, setPreview] = useState<RoleTemplate | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const language = i18n.language || 'en-US';
  const latestResume = resumes[0];

  useEffect(() => {
    fetchResumes().catch(() => undefined);
  }, [fetchResumes]);

  const filtered = useMemo(
    () => (category === 'all' ? ROLE_TEMPLATES : ROLE_TEMPLATES.filter((item) => item.category === category)),
    [category],
  );

  const previewResume = useMemo(
    () => (preview ? buildPreviewResume(preview, language) : null),
    [preview, language],
  );

  const handleUseTemplate = useCallback(async (template: RoleTemplate) => {
    setCreatingId(template.id);
    try {
      const { resume, partial } = await createResumeFromRoleTemplate(template, language);
      if (partial) {
        message.warning(t('home.usePartial'));
      } else {
        message.success(t('home.useSuccess'));
      }
      navigate(`/editor/${resume.id}`);
    } catch (error: unknown) {
      if (openUpgradePrompt(error)) return;
      message.error(t('home.useFailed', { message: getErrorMessage(error) }));
    } finally {
      setCreatingId(null);
    }
  }, [language, navigate, t]);

  const handleCreateBlank = async (values: { title: string }) => {
    try {
      const resume = await createResume(values.title || t('dashboard.createDefaultTitle'));
      message.success(t('dashboard.createSuccess'));
      setCreateModalOpen(false);
      form.resetFields();
      navigate(`/editor/${resume.id}`);
    } catch (error: unknown) {
      if (openUpgradePrompt(error)) {
        setCreateModalOpen(false);
        form.resetFields();
        return;
      }
      message.error(t('dashboard.createFailed', { message: getErrorMessage(error) }));
    }
  };

  return (
    <div className="tpl-home">
      <section className="tpl-home-hero">
        <div className="tpl-home-badge">
          <AppstoreOutlined />
          {t('home.badge')}
        </div>
        <Title level={1} className="tpl-home-title">
          {t('home.title')}
        </Title>
        <Paragraph className="tpl-home-subtitle">
          {t('home.subtitle')}
        </Paragraph>
        <div className="tpl-home-hero-actions">
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            {t('home.startBlank')}
          </Button>
          <Button
            size="large"
            icon={<FileTextOutlined />}
            onClick={() => navigate('/dashboard')}
          >
            {t('home.myResumes', { count: resumes.length })}
          </Button>
        </div>
        {latestResume && (
          <div className="tpl-home-continue">
            <Link className="tpl-home-continue-link" to={`/editor/${latestResume.id}`}>
              {t('home.continueEdit', { title: latestResume.title })}
            </Link>
          </div>
        )}
      </section>

      <div className="tpl-home-toolbar">
        <Segmented
          value={category}
          onChange={(value) => setCategory(value as 'all' | RoleCategory)}
          options={CATEGORY_OPTIONS.map((item) => ({
            value: item.value,
            label: t(item.labelKey),
          }))}
        />
        <span className="tpl-home-count">{t('home.countLabel', { count: filtered.length })}</span>
      </div>

      {filtered.length === 0 ? (
        <Empty description={t('home.emptyCategory')} />
      ) : (
        <Row gutter={[20, 20]}>
          {filtered.map((template) => {
            const content = getRoleContent(template, language);
            return (
              <Col xs={24} sm={12} lg={8} xxl={6} key={template.id}>
                <article className="tpl-home-card" onClick={() => setPreview(template)}>
                  <div className="tpl-home-card-thumb">
                    <RoleTemplateThumbnail template={template} language={language} />
                    <div className="tpl-home-thumb-mask">{t('home.previewAction')}</div>
                  </div>
                  <div className="tpl-home-card-body">
                    <h3 className="tpl-home-role">{content.roleName}</h3>
                    <p className="tpl-home-tagline">{content.tagline}</p>
                    <div className="tpl-home-chips">
                      <Tag color="gold">{t(TEMPLATE_NAME_KEYS[template.templateId] || 'common.template')}</Tag>
                      {content.keywords.slice(0, 3).map((keyword) => (
                        <Tag key={keyword}>{keyword}</Tag>
                      ))}
                    </div>
                    <div className="tpl-home-card-actions">
                      <Button
                        onClick={(event) => {
                          event.stopPropagation();
                          setPreview(template);
                        }}
                      >
                        {t('home.previewAction')}
                      </Button>
                      <Button
                        type="primary"
                        loading={creatingId === template.id}
                        disabled={Boolean(creatingId) && creatingId !== template.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleUseTemplate(template);
                        }}
                      >
                        {t('home.useAction')}
                      </Button>
                    </div>
                  </div>
                </article>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal
        title={t('home.previewTitle')}
        open={Boolean(preview)}
        onCancel={() => setPreview(null)}
        footer={null}
        width={1040}
        destroyOnClose
      >
        {preview && previewResume && (
          <div className="tpl-home-preview">
            <div className="tpl-home-preview-paper">
              <PrintDocument resume={previewResume} locale={language} fitMode="screen" />
            </div>
            <div className="tpl-home-preview-side">
              <h3 className="tpl-home-preview-name">{getRoleContent(preview, language).roleName}</h3>
              <p className="tpl-home-preview-tagline">{getRoleContent(preview, language).tagline}</p>
              <div className="tpl-home-preview-block">
                <h4 className="tpl-home-preview-heading">{t('home.tipsTitle')}</h4>
                <ol className="tpl-home-tips">
                  {getRoleContent(preview, language).highlights.map((tip, index) => (
                    <li key={tip}>
                      <span className="tpl-home-tip-index">{index + 1}</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="tpl-home-preview-block">
                <h4 className="tpl-home-preview-heading">{t('home.templateInfoTitle')}</h4>
                <div className="tpl-home-meta">
                  <div className="tpl-home-meta-row">
                    <span className="tpl-home-meta-label">{t('home.templateLabel')}</span>
                    <span>{t(TEMPLATE_NAME_KEYS[preview.templateId] || 'common.template')}</span>
                  </div>
                  <div className="tpl-home-meta-row">
                    <span className="tpl-home-meta-label">{t('home.colorLabel')}</span>
                    <span className="tpl-home-color" style={{ backgroundColor: preview.themeColor }} />
                    <span>{preview.themeColor}</span>
                  </div>
                  <div className="tpl-home-meta-row">
                    <span className="tpl-home-meta-label">{t('home.densityLabel')}</span>
                    <span>{t(`home.density.${preview.layoutDensity}`)}</span>
                  </div>
                </div>
              </div>
              <div className="tpl-home-preview-cta">
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={creatingId === preview.id}
                  disabled={Boolean(creatingId) && creatingId !== preview.id}
                  onClick={() => void handleUseTemplate(preview)}
                >
                  {t('home.useAction')}
                </Button>
                <Text className="tpl-home-use-hint">{t('home.useHint')}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={t('dashboard.modalTitle')}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBlank}>
          <Form.Item
            label={t('dashboard.resumeTitleLabel')}
            name="title"
            rules={[
              { required: true, message: t('dashboard.resumeTitleRequired') },
              { max: 255, message: t('dashboard.resumeTitleTooLong') },
            ]}
          >
            <Input placeholder={t('dashboard.resumeTitlePlaceholder')} autoFocus />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalOpen(false)}>{t('dashboard.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {t('dashboard.confirmCreate')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateHome;
