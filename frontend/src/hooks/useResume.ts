import { useResumeStore } from '@/store/resumeStore';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

export const useResume = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    resumes,
    currentResume,
    isLoading,
    error,
    fetchResumes,
    fetchResume,
    createResume: createResumeAction,
    updateResume: updateResumeAction,
    deleteResume: deleteResumeAction,
    duplicateResume: duplicateResumeAction,
    setCurrentResume,
    clearError,
  } = useResumeStore();

  const createResume = async (title: string, templateId?: number) => {
    try {
      const resume = await createResumeAction(title, templateId);
      message.success(t('resume.actions.createSuccess'));
      navigate(`/editor/${resume.id}`);
      return resume;
    } catch (error: any) {
      message.error(error.message || t('resume.actions.createFailed'));
      throw error;
    }
  };

  const updateResume = async (
    id: number,
    data: { title?: string; templateId?: number }
  ) => {
    try {
      await updateResumeAction(id, data);
      message.success(t('resume.actions.updateSuccess'));
    } catch (error: any) {
      message.error(error.message || t('resume.actions.updateFailed'));
      throw error;
    }
  };

  const deleteResume = async (id: number) => {
    try {
      await deleteResumeAction(id);
      message.success(t('resume.actions.deleteSuccess'));
    } catch (error: any) {
      message.error(error.message || t('resume.actions.deleteFailed'));
      throw error;
    }
  };

  const duplicateResume = async (id: number) => {
    try {
      const resume = await duplicateResumeAction(id);
      message.success(t('resume.actions.duplicateSuccess'));
      return resume;
    } catch (error: any) {
      message.error(error.message || t('resume.actions.duplicateFailed'));
      throw error;
    }
  };

  return {
    resumes,
    currentResume,
    isLoading,
    error,
    fetchResumes,
    fetchResume,
    createResume,
    updateResume,
    deleteResume,
    duplicateResume,
    setCurrentResume,
    clearError,
  };
};

export default useResume;
