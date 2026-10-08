import { useArgs } from "storybook/preview-api";
import { Pagination } from "components/pagination";

/** Pagination — under a DataTable. */
export default {
  title: "Data/Pagination",
  component: Pagination,
  args: { page: 1, pageSize: 10, total: 60 },
  decorators: [(Story) => <div className="w-[560px] rounded-xl border border-slate-200 bg-white"><Story /></div>],
};

function PaginationStory(args) {
  const [, updateArgs] = useArgs();
  return <Pagination {...args} onPageChange={(page) => updateArgs({ page })} />;
}

export const Default = { render: PaginationStory };

export const LastPage = { args: { page: 6 }, render: PaginationStory };

export const Empty = { args: { total: 0 }, render: PaginationStory };
