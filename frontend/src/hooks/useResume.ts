import { useResumeStore } from '@/store/resumeStore';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

export const useResume = () => {
  const navigate = useNavigate();
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
      message.success('Resume created successfully');
      navigate(`/editor/${resume.id}`);
      return resume;
    } catch (error: any) {
      message.error(error.message || 'Failed to create resume');
      throw error;
    }
  };

  const updateResume = async (
    id: number,
    data: { title?: string; templateId?: number }
  ) => {
    try {
      await updateResumeAction(id, data);
      message.success('Resume updated successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to update resume');
      throw error;
    }
  };

  const deleteResume = async (id: number) => {
    try {
      await deleteResumeAction(id);
      message.success('Resume deleted successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to delete resume');
      throw error;
    }
  };

  const duplicateResume = async (id: number) => {
    try {
      const resume = await duplicateResumeAction(id);
      message.success('Resume duplicated successfully');
      return resume;
    } catch (error: any) {
      message.error(error.message || 'Failed to duplicate resume');
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
