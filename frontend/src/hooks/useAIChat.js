import { useMutation, useQueryClient } from "@tanstack/react-query";
import { askQuestion } from "../services/aiService";

export function useAIChat(profileId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (question) => askQuestion(question, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatHistory", profileId] });
    },
  });
}
