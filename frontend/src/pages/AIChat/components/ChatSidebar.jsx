import Button from "../../../components/shared/Button";
import EmptyState from "../../../components/shared/EmptyState";
import Loader from "../../../components/shared/Loader";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatSidebar({
  history,
  loading,
  activeId,
  onSelect,
  onDelete,
  onClear,
  clearing,
}) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-white/5 bg-card lg:w-72">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <h2 className="text-sm font-semibold text-secondary-100">
          Lịch sử chat
        </h2>
        {history?.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={clearing}
          >
            {clearing ? <Loader size="sm" /> : "Xóa hết"}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : history?.length === 0 ? (
          <EmptyState
            title="Chưa có lịch sử"
            description="Câu hỏi của bạn sẽ được lưu tại đây."
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`group w-full rounded-xl p-3 text-left transition-colors ${
                    activeId === item.id
                      ? "bg-accent-blue/20 border border-accent-blue/30"
                      : "hover:bg-white/5"
                  }`}
                >
                  <p className="truncate text-sm font-medium text-secondary-100">
                    {item.question}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-secondary-300">
                      {formatDate(item.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="text-xs text-danger opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Xóa
                    </button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
