import { memo, useMemo } from 'react';
import PrintDocument from '@/components/pdf/PrintDocument';
import type { RoleTemplate } from '@/data/roleTemplates';
import { buildPreviewResume } from '@/services/roleTemplateService';
import './RoleTemplateThumbnail.css';

interface RoleTemplateThumbnailProps {
  template: RoleTemplate;
  language: string;
}

export const RoleTemplateThumbnail = memo(function RoleTemplateThumbnail({
  template,
  language,
}: RoleTemplateThumbnailProps) {
  const resume = useMemo(() => buildPreviewResume(template, language), [template, language]);

  return (
    <div className="role-thumb" aria-hidden inert>
      <div className="role-thumb-stage">
        <PrintDocument resume={resume} locale={language} fitMode="screen" />
      </div>
    </div>
  );
});

export default RoleTemplateThumbnail;
