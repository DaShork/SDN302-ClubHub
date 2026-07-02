import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearChatHistory,
  deleteChatEntry,
  getChatHistory,
} from "../services/chatHistoryService";

export function useChatHistory(profileId) {
  return useQuery({
    queryKey: ["chatHistory", profileId],
    queryFn: () => getChatHistory(profileId),
    enabled: !!profileId,
  });
}

export function useDeleteChatEntry(profileId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChatEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatHistory", profileId] });
    },
  });
}

export function useClearChatHistory(profileId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearChatHistory(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatHistory", profileId] });
    },
  });
}
