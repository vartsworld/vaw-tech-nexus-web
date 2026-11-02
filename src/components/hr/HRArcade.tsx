import ArcadeHub from "@/components/staff/ArcadeHub";

interface HRArcadeProps {
  /** "arcade" for the game list, otherwise a game id */
  room: string;
  profile: any;
  onNavigate: (room: string) => void;
}

/** The same games staff have, available to HR from the Arcade page. */
const HRArcade = ({ room, profile, onNavigate }: HRArcadeProps) => (
  <ArcadeHub
    gameId={room === "arcade" ? null : room}
    profile={profile}
    onSelect={onNavigate}
    onBack={() => onNavigate("arcade")}
  />
);

export default HRArcade;
