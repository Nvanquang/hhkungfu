import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { animeService } from "@/services/animeService";
import { toast } from "sonner";
import type { Genre, Studio } from "@/types/anime.types";

export function useGenreStudio() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false); // For mobile bottom sheet

  // Queries
  const genresQuery = useQuery({
    queryKey: ["admin", "genres"],
    queryFn: animeService.getGenres,
  });

  const studiosQuery = useQuery({
    queryKey: ["admin", "studios"],
    queryFn: animeService.getStudios,
  });

  // Genre Mutations
  const createGenreMutation = useMutation({
    mutationFn: animeService.createGenre,
    onSuccess: () => {
      toast.success("Đã thêm thể loại mới");
      queryClient.invalidateQueries({ queryKey: ["admin", "genres"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lỗi khi thêm thể loại"),
  });

  const updateGenreMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => animeService.updateGenre(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật thể loại");
      queryClient.invalidateQueries({ queryKey: ["admin", "genres"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lỗi khi cập nhật thể loại"),
  });

  const deleteGenreMutation = useMutation({
    mutationFn: animeService.deleteGenre,
    onSuccess: () => {
      toast.success("Đã xóa thể loại");
      queryClient.invalidateQueries({ queryKey: ["admin", "genres"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lỗi khi xóa thể loại"),
  });

  // Studio Mutations
  const createStudioMutation = useMutation({
    mutationFn: animeService.createStudio,
    onSuccess: () => {
      toast.success("Đã thêm studio mới");
      queryClient.invalidateQueries({ queryKey: ["admin", "studios"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lỗi khi thêm studio"),
  });

  const updateStudioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => animeService.updateStudio(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật studio");
      queryClient.invalidateQueries({ queryKey: ["admin", "studios"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lỗi khi cập nhật studio"),
  });

  const deleteStudioMutation = useMutation({
    mutationFn: animeService.deleteStudio,
    onSuccess: () => {
      toast.success("Đã xóa studio");
      queryClient.invalidateQueries({ queryKey: ["admin", "studios"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lỗi khi xóa studio"),
  });

  const resetForm = () => {
    setEditingGenre(null);
    setEditingStudio(null);
    setIsFormOpen(false);
  };

  return {
    search,
    setSearch,
    genres: genresQuery.data?.data ?? [],
    studios: studiosQuery.data?.data ?? [],
    isLoading: genresQuery.isLoading || studiosQuery.isLoading,
    
    editingGenre,
    setEditingGenre: (g: Genre | null) => { setEditingGenre(g); if(g) setIsFormOpen(true); },
    editingStudio,
    setEditingStudio: (s: Studio | null) => { setEditingStudio(s); if(s) setIsFormOpen(true); },
    
    isFormOpen,
    setIsFormOpen,
    resetForm,

    createGenre: createGenreMutation.mutate,
    updateGenre: updateGenreMutation.mutate,
    deleteGenre: deleteGenreMutation.mutate,
    
    createStudio: createStudioMutation.mutate,
    updateStudio: updateStudioMutation.mutate,
    deleteStudio: deleteStudioMutation.mutate,

    isSaving: createGenreMutation.isPending || updateGenreMutation.isPending || createStudioMutation.isPending || updateStudioMutation.isPending,
  };
}
