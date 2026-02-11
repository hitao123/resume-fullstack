import { useState } from 'react';
import { Button, Tag, Input, Select, Space, Card, Empty, Row, Col } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import type { Skill } from '@/types/resume.types';

interface SkillsSectionProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}

const SKILL_CATEGORIES = [
  '编程语言',
  '前端框架',
  '后端框架',
  '数据库',
  '工具',
  '云服务',
  '其他',
];

const PROFICIENCY_LEVELS = [
  { value: '了解', color: 'default' },
  { value: '熟悉', color: 'blue' },
  { value: '熟练', color: 'green' },
  { value: '精通', color: 'gold' },
];

export const SkillsSection = ({ data, onChange }: SkillsSectionProps) => {
  const [inputVisible, setInputVisible] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState(SKILL_CATEGORIES[0]);
  const [proficiencyLevel, setProficiencyLevel] = useState('熟练');

  const handleAdd = () => {
    if (skillName.trim()) {
      const newSkill: Skill = {
        id: Date.now(),
        resumeId: 0,
        category: skillCategory,
        name: skillName.trim(),
        proficiencyLevel: proficiencyLevel,
        displayOrder: data.length,
      };
      onChange([...data, newSkill]);
      setSkillName('');
      setInputVisible(false);
    }
  };

  const handleDelete = (id: number) => {
    onChange(data.filter((skill) => skill.id !== id));
  };

  // 按类别分组技能
  const groupedSkills = data.reduce((acc, skill) => {
    const category = skill.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getProficiencyColor = (level?: string) => {
    const found = PROFICIENCY_LEVELS.find((p) => p.value === level);
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
                  placeholder="输入技能名称"
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
                  {SKILL_CATEGORIES.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  value={proficiencyLevel}
                  onChange={setProficiencyLevel}
                  style={{ width: 100 }}
                  size="large"
                >
                  {PROFICIENCY_LEVELS.map((level) => (
                    <Select.Option key={level.value} value={level.value}>
                      {level.value}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Space>
                  <Button type="primary" onClick={handleAdd}>
                    添加
                  </Button>
                  <Button onClick={() => setInputVisible(false)}>取消</Button>
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
              添加技能
            </Button>
          )}
        </Space>
      </Card>

      {Object.keys(groupedSkills).length === 0 ? (
        <Empty description="暂无技能" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <Card key={category} size="small" title={category}>
              <Space size={[8, 8]} wrap>
                {skills.map((skill) => (
                  <Tag
                    key={skill.id}
                    closable
                    onClose={() => handleDelete(skill.id)}
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