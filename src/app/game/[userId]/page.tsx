import { GameDashboard } from "@/components/game-dashboard";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function GamePage({ params }: Props) {
  const { userId } = await params;
  return <GameDashboard userId={userId} />;
}
