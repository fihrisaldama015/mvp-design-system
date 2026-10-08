import { Plus, Download } from "lucide-react";
import { Button } from "components/button";
import { PageHeader } from "components/page-header";

/** PageHeader — title row at the top of each page. */
export default {
  title: "Navigation/PageHeader",
  component: PageHeader,
  args: { title: "Equipment" },
  parameters: { layout: "padded" },
};

export const Default = { args: { description: "60 items across 6 categories" } };

export const WithActions = {
  render: (args) => (
    <PageHeader
      {...args}
      description="60 items across 6 categories"
      actions={
        <>
          <Button variant="secondary" leftIcon={<Download size={16} />}>Export</Button>
          <Button leftIcon={<Plus size={16} />}>Add equipment</Button>
        </>
      }
    />
  ),
};

export const TitleOnly = {};
