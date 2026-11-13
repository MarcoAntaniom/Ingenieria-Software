import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmTaskSubmission,
  createTask,
  fetchMyDelivery,
  fetchStudentPending,
  fetchSubmissionReceipt,
  fetchTask,
  fetchTeacherSections,
  fetchTeacherSubmissions,
  fetchTeacherTasks,
  markSubmissionInReview,
  reopenSubmission,
  saveTaskDraft,
  updateTask,
} from '../../services/tasks'

export const taskKeys = {
  pending: (page) => ['tasks', 'pending', page],
  detail: (taskId) => ['tasks', 'detail', taskId],
  myDelivery: (taskId) => ['tasks', 'my-delivery', taskId],
  receipt: (submissionId) => ['tasks', 'receipt', submissionId],
  sections: (page) => ['teacher', 'sections', page],
  sectionTasks: (sectionId, page) => ['teacher', 'section-tasks', sectionId, page],
  submissions: (page) => ['teacher', 'submissions', page],
}

export function useStudentPending(page = 1) {
  return useQuery({
    queryKey: taskKeys.pending(page),
    queryFn: ({ signal }) => fetchStudentPending(page, signal),
  })
}

export function useTask(taskId) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: ({ signal }) => fetchTask(taskId, signal),
    enabled: Number.isInteger(taskId),
  })
}

export function useMyDelivery(taskId) {
  return useQuery({
    queryKey: taskKeys.myDelivery(taskId),
    queryFn: ({ signal }) => fetchMyDelivery(taskId, signal),
    enabled: Number.isInteger(taskId),
  })
}

export function useSubmissionReceipt(submissionId) {
  return useQuery({
    queryKey: taskKeys.receipt(submissionId),
    queryFn: ({ signal }) => fetchSubmissionReceipt(submissionId, signal),
    enabled: Number.isInteger(submissionId),
  })
}

export function useTeacherSections(page = 1) {
  return useQuery({
    queryKey: taskKeys.sections(page),
    queryFn: ({ signal }) => fetchTeacherSections(page, signal),
  })
}

export function useTeacherTasks(sectionId, page = 1) {
  return useQuery({
    queryKey: taskKeys.sectionTasks(sectionId, page),
    queryFn: ({ signal }) => fetchTeacherTasks(sectionId, page, signal),
    enabled: Number.isInteger(sectionId) && sectionId > 0,
  })
}

export function useTeacherSubmissions(page = 1) {
  return useQuery({
    queryKey: taskKeys.submissions(page),
    queryFn: ({ signal }) => fetchTeacherSubmissions(page, signal),
  })
}

export function useSaveTaskDraft(taskId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, comment, onProgress }) =>
      saveTaskDraft({ taskId, file, comment }, onProgress),
    onSuccess: (delivery) => {
      queryClient.setQueryData(taskKeys.myDelivery(taskId), delivery)
      queryClient.invalidateQueries({ queryKey: ['tasks', 'pending'] })
    },
  })
}

export function useConfirmTaskSubmission(taskId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmTaskSubmission,
    onSuccess: (receipt) => {
      queryClient.setQueryData(taskKeys.receipt(receipt.id_entrega), receipt)
      queryClient.invalidateQueries({ queryKey: ['tasks', 'pending'] })
      queryClient.invalidateQueries({ queryKey: taskKeys.myDelivery(taskId) })
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask(taskId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateTask.bind(null, taskId),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(taskId), task)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

function useSubmissionMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'submissions'] })
    },
  })
}

export function useMarkSubmissionInReview() {
  return useSubmissionMutation(markSubmissionInReview)
}

export function useReopenSubmission() {
  return useSubmissionMutation(reopenSubmission)
}
