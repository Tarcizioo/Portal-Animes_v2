import { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { CommentItem } from './CommentItem';
import { useToast } from '@/context/ToastContext';

export function CommentsSection({ animeId, animeTitle = '' }) {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const { toast } = useToast();
    const { comments, loading, addComment, deleteComment, toggleLike } = useComments(animeId, profile, animeTitle);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await addComment(newComment);
            setNewComment("");
            toast.success("Comentário enviado!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (window.confirm("Tem certeza que deseja deletar este comentário?")) {
            try {
                await deleteComment(commentId);
                toast.success("Comentário removido.");
            } catch {
                toast.error("Erro ao remover comentário.");
            }
        }
    };

    return (
        <section className="mt-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Comentários ({comments.length})
            </h2>

            {/* Input form */}
            <div className="mb-8">
                {user ? (
                    <form onSubmit={handleSubmit} className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Deixe seu comentário sobre este anime..."
                            className="w-full bg-bg-secondary border border-border-color rounded-xl p-4 pr-14 text-text-primary placeholder:text-text-secondary focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none min-h-[100px] transition-all"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="absolute bottom-4 right-4 p-2 bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                ) : (
                    <div className="bg-bg-secondary/50 border border-border-color rounded-xl p-6 text-center">
                        <p className="text-text-secondary">
                            Você precisa estar logado para comentar.
                        </p>
                    </div>
                )}
            </div>

            {/* Loading / List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onDelete={handleDelete}
                                onLike={toggleLike}
                            />
                        ))
                    ) : (
                        <p className="text-text-secondary text-center py-8 italic">
                            Seja o primeiro a comentar!
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}
