const API_BASE_URL = '/api';

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include', // Include cookies in requests
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
};

export const api = {
    // Auth
    login: (email: string) =>
        fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password: '123456' }),
        }),

    logout: () =>
        fetchWithAuth('/auth/logout', {
            method: 'POST',
        }),

    getCurrentUser: () => fetchWithAuth('/auth/me'),

    // Templates
    getTemplates: () => fetchWithAuth('/templates'),

    getTemplate: (id: string) => fetchWithAuth(`/templates/${id}`),

    createTemplate: (data: any) =>
        fetchWithAuth('/templates', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateTemplate: (id: string, data: any) =>
        fetchWithAuth(`/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    publishTemplate: (id: string) =>
        fetchWithAuth(`/templates/${id}/publish`, {
            method: 'PUT',
        }),

    unpublishTemplate: (id: string) =>
        fetchWithAuth(`/templates/${id}/unpublish`, {
            method: 'PUT',
        }),

    deleteTemplate: (id: string) =>
        fetchWithAuth(`/templates/${id}`, {
            method: 'DELETE',
        }),

    copyTemplate: (id: string, targetCourseId?: string) =>
        fetchWithAuth(`/templates/${id}/copy`, {
            method: 'POST',
            body: JSON.stringify({ targetCourseId }),
        }),

    // Classrooms
    getClassrooms: () => fetchWithAuth('/classrooms'),

    getTeacherStats: () => fetchWithAuth('/classrooms/stats/teacher'),

    getClassroom: (id: string) => fetchWithAuth(`/classrooms/${id}`),

    getClassroomStats: (id: string) => fetchWithAuth(`/classrooms/${id}/stats`),

    createClassroom: (data: { name: string; description?: string; courseCode: string; courseId?: string }) =>
        fetchWithAuth('/classrooms', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    enrollStudent: (classroomId: string, studentEmail: string) =>
        fetchWithAuth(`/classrooms/${classroomId}/enroll`, {
            method: 'POST',
            body: JSON.stringify({ studentEmail }),
        }),

    joinClassroom: (code: string) =>
        fetchWithAuth('/classrooms/join', {
            method: 'POST',
            body: JSON.stringify({ code }),
        }),

    removeStudent: (classroomId: string, studentId: string) =>
        fetchWithAuth(`/classrooms/${classroomId}/students/${studentId}`, {
            method: 'DELETE',
        }),

    updateClassroom: (id: string, data: { name?: string; description?: string; courseCode?: string }) =>
        fetchWithAuth(`/classrooms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteClassroom: (id: string) =>
        fetchWithAuth(`/classrooms/${id}`, {
            method: 'DELETE',
        }),

    // Course Management
    getCourses: () => fetchWithAuth('/courses'),
    getCourse: (id: string) => fetchWithAuth(`/courses/${id}`),
    createCourse: (data: { title: string; description: string; department: string }) =>
        fetchWithAuth('/courses', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    updateCourse: (id: string, data: { title: string; description: string; department: string }) =>
        fetchWithAuth(`/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    deleteCourse: (id: string) =>
        fetchWithAuth(`/courses/${id}`, {
            method: 'DELETE',
        }),

    // Experiments
    getExperiments: (classroomId: string) =>
        fetchWithAuth(`/experiments/classroom/${classroomId}`),

    getExperiment: (id: string) => fetchWithAuth(`/experiments/${id}`),

    createExperiment: (data: {
        title: string;
        description?: string;
        classroomId: string;
        templateId: string;
        dueDate?: string;
        batchId?: string;
    }) =>
        fetchWithAuth('/experiments', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateExperiment: (id: string, data: {
        title: string;
        description?: string;
        dueDate?: string;
        batchId?: string;
    }) =>
        fetchWithAuth(`/experiments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // Batches
    getBatches: (classroomId: string) =>
        fetchWithAuth(`/batches/classroom/${classroomId}`),

    createBatch: (data: { classroomId: string; name: string; studentIds: string[] }) =>
        fetchWithAuth('/batches', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateBatch: (id: string, data: { name?: string; studentIds?: string[] }) =>
        fetchWithAuth(`/batches/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteBatch: (id: string) =>
        fetchWithAuth(`/batches/${id}`, {
            method: 'DELETE',
        }),

    // Submissions
    getMySubmissions: () => fetchWithAuth('/submissions/my'),

    getExperimentSubmissions: (experimentId: string) =>
        fetchWithAuth(`/submissions/assignment/${experimentId}`),

    createSubmission: (data: any) =>
        fetchWithAuth('/submissions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateSubmission: (id: string, data: any) =>
        fetchWithAuth(`/submissions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    gradeSubmission: (id: string, grade: number, feedback?: string) =>
        fetchWithAuth(`/submissions/${id}/grade`, {
            method: 'PUT',
            body: JSON.stringify({ grade, feedback }),
        }),

    reviewSubmission: (id: string, status: string, remarks?: string) =>
        fetchWithAuth(`/submissions/${id}/review`, {
            method: 'PUT',
            body: JSON.stringify({ status, remarks }),
        }),

    finalizeSubmission: (id: string, grade: number, feedback?: string) =>
        fetchWithAuth(`/submissions/${id}/finalize`, {
            method: 'PUT',
            body: JSON.stringify({ grade, feedback }),
        }),

    getSubmissionsByExperiment: (experimentId: string) =>
        fetchWithAuth(`/submissions/experiment/${experimentId}`),
};
