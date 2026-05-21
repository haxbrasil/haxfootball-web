import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataCard, PageHeader } from "./app-shell";

const meta = {
  title: "DS/PageHeader",
  component: PageHeader,
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  args: {
    title: "Partidas",
    description: "Arquivo público de partidas e estatísticas.",
  },
  render: (args) => (
    <div className="max-w-3xl">
      <PageHeader {...args} />
      <DataCard title="Card de dados">Conteúdo operacional compacto.</DataCard>
    </div>
  ),
};
