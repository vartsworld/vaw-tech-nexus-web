import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, TrendingDown, Clock, Coins } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChessGameOverDialogProps {
    open: boolean;
    onClose: () => void;
    gameData: {
        winner_id: string;
        player1_id: string;
        player2_id: string;
        player1_name: string;
        player2_name: string;
        duration_seconds?: number;
        game_id: string;
    };
    eloChanges?: {
        winner_elo_before: number;
        winner_elo_after: number;
        loser_elo_before: number;
        loser_elo_after: number;
    };
    coinsEarned?: number;
}

export const ChessGameOverDialog = ({
    open,
    onClose,
    gameData,
    eloChanges,
    coinsEarned
}: ChessGameOverDialogProps) => {
    const isWinner = gameData.winner_id === gameData.player1_id;
    const winnerName = isWinner ? gameData.player1_name : gameData.player2_name;
    const loserName = isWinner ? gameData.player2_name : gameData.player1_name;

    const winnerEloChange = eloChanges
        ? eloChanges.winner_elo_after - eloChanges.winner_elo_before
        : 0;
    const loserEloChange = eloChanges
        ? eloChanges.loser_elo_after - eloChanges.loser_elo_before
        : 0;

    const formatDuration = (seconds?: number) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-yellow-500/50">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                        <Trophy className="w-8 h-8" />
                        Game Over!
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Winner Announcement */}
                    <Card className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3 animate-bounce" />
                                <h3 className="text-xl font-bold text-white mb-1">Winner</h3>
                                <p className="text-3xl font-black text-yellow-400">{winnerName}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ELO Changes */}
                    {eloChanges && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Winner ELO */}
                            <Card className="bg-green-500/10 border-green-500/30">
                                <CardContent className="pt-4">
                                    <div className="text-center">
                                        <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                        <p className="text-sm text-white/70 mb-1">{winnerName}</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-lg text-white">{eloChanges.winner_elo_before}</span>
                                            <span className="text-green-400 font-bold">→</span>
                                            <span className="text-xl font-bold text-green-400">{eloChanges.winner_elo_after}</span>
                                        </div>
                                        <p className="text-green-400 text-sm font-bold mt-1">
                                            +{winnerEloChange}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Loser ELO */}
                            <Card className="bg-red-500/10 border-red-500/30">
                                <CardContent className="pt-4">
                                    <div className="text-center">
                                        <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                        <p className="text-sm text-white/70 mb-1">{loserName}</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-lg text-white">{eloChanges.loser_elo_before}</span>
                                            <span className="text-red-400 font-bold">→</span>
                                            <span className="text-xl font-bold text-red-400">{eloChanges.loser_elo_after}</span>
                                        </div>
                                        <p className="text-red-400 text-sm font-bold mt-1">
                                            {loserEloChange}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Game Stats */}
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white/70">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Duration</span>
                                    </div>
                                    <span className="text-white font-semibold">
                                        {formatDuration(gameData.duration_seconds)}
                                    </span>
                                </div>

                                {coinsEarned !== undefined && coinsEarned > 0 && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-yellow-400/70">
                                            <Coins className="w-4 h-4" />
                                            <span className="text-sm">VAW Coins Earned</span>
                                        </div>
                                        <span className="text-yellow-400 font-bold text-lg">
                                            +{coinsEarned}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Close Button */}
                    <Button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
