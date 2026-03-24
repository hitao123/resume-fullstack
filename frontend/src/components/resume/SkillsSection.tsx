import { useState, useEffect, useMemo } from 'react';
import { Button, Tag, Input, Select, Space, Card, Empty, Row, Col, message } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import type { Skill } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import { useTranslation } from 'react-i18next';

interface SkillsSectionProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}

const PROFICIENCY_LEVELS = [
  { key: 'basic', color: 'default' },
  { key: 'familiar', color: 'gold' },
  { key: 'proficient', color: 'green' },
  { key: 'expert', color: 'gold' },
];

export const SkillsSection = ({ data, onChange }: SkillsSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const categories = useMemo(
    () => [
      { key: 'language', label: t('resume.skills.categories.language') },
      { key: 'frontend', label: t('resume.skills.categories.frontend') },
      { key: 'backend', label: t('resume.skills.categories.backend') },
      { key: 'database', label: t('resume.skills.categories.database') },
      { key: 'tools', label: t('resume.skills.categories.tools') },
      { key: 'cloud', label: t('resume.skills.categories.cloud') },
      { key: 'other', label: t('resume.skills.categories.other') },
    ],
    [t]
  );

  const [inputVisible, setInputVisible] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState(categories[0]?.key ?? 'language');
  const [proficiencyLevel, setProficiencyLevel] = useState<string>('proficient');
  const [saving, setSaving] = useState(false);

  // Load data when component mounts
  useEffect(() => {
    if (id) {
      loadSkills();
    }
  }, [id]);

  const loadSkills = async () => {
    if (!id) return;
    try {
      const skills = await resumeService.getSkills(Number(id));
      onChange(skills);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(t('resume.skills.loadFailed', { message: msg }));
    }
  };

  const handleAdd = async () => {
    if (!id || !skillName.trim()) return;

    setSaving(true);
    try {
      const skillData = {
        category: skillCategory,
        name: skillName.trim(),
        proficiencyLevel: t(`resume.skills.proficiency.${proficiencyLevel}`),
        displayOrder: data.length,
      };

      await resumeService.createSkill(Number(id), skillData);
      message.success(t('resume.skills.addSuccess'));
      await loadSkills();
      setSkillName('');
      setInputVisible(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(t('resume.skills.addFailed', { message: msg }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skill: Skill) => {
    if (!id) return;

    try {
      await resumeService.deleteSkill(Number(id), skill.id);
      message.success(t('resume.skills.deleteSuccess'));
      await loadSkills();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(t('resume.skills.deleteFailed', { message: msg }));
    }
  };

  // 按类别分组技能
  const groupedSkills = data.reduce((acc, skill) => {
    const key = skill.category || t('resume.skills.categories.other');
    const category =
      categories.find((c) => c.key === key)?.label ||
      skill.category ||
      t('resume.skills.categories.other');
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getProficiencyColor = (level?: string) => {
    const found = PROFICIENCY_LEVELS.find(
      (p) => t(`resume.skills.proficiency.${p.key}`) === level
    );
    return found?.color || 'default';
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {inputVisible ? (
            <Row gutter={8} align="middle">
              <Col flex="auto">
                <Input
                  placeholder={t('resume.skills.inputPlaceholder')}
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  onPressEnter={handleAdd}
                  autoFocus
                  size="large"
                />
              </Col>
              <Col>
                <Select
                  value={skillCategory}
                  onChange={setSkillCategory}
                  style={{ width: 120 }}
                  size="large"
                >
                  {categories.map((cat) => (
                    <Select.Option key={cat.key} value={cat.key}>
                      {cat.label}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  value={proficiencyLevel}
                  onChange={(val) => setProficiencyLevel(val)}
                  style={{ width: 100 }}
                  size="large"
                >
                  {PROFICIENCY_LEVELS.map((level) => (
                    <Select.Option key={level.key} value={level.key}>
                      {t(`resume.skills.proficiency.${level.key}`)}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Space className='mt-10'>
                  <Button type="primary" onClick={handleAdd} loading={saving}>
                    {t('resume.skills.addConfirm')}
                  </Button>
                  <Button onClick={() => setInputVisible(false)}>
                    {t('resume.skills.cancel')}
                  </Button>
                </Space>
              </Col>
            </Row>
          ) : (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setInputVisible(true)}
              block
              size="large"
            >
              {t('resume.skills.addButton')}
            </Button>
          )}
        </Space>
      </Card>

      {Object.keys(groupedSkills).length === 0 ? (
        <Empty description={t('resume.skills.emptyDescription')} />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <Card key={category} size="small" title={category}>
              <Space size={[8, 8]} wrap>
                {skills.map((skill) => (
                  <Tag
                    key={skill.id}
                    closable
                    onClose={() => handleDelete(skill)}
                    color={getProficiencyColor(skill.proficiencyLevel)}
                    style={{ fontSize: 14, padding: '4px 8px' }}
                    closeIcon={<CloseOutlined />}
                  >
                    {skill.name}
                    {skill.proficiencyLevel && (
                      <span style={{ marginLeft: 4, opacity: 0.8 }}>
                        · {skill.proficiencyLevel}
                      </span>
                    )}
                  </Tag>
                ))}
              </Space>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
};

export default SkillsSection;
