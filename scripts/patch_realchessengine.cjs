const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert states
  const stateInsertPoint = "const [lastMovedSquare, setLastMovedSquare] = useState<string | null>(null);";
  const stateInserts = `
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState({});
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState<number>(400);

  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current) {
        setBoardWidth(boardRef.current.clientWidth - 12); // Account for padding
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
`;
  content = content.replace(stateInsertPoint, stateInsertPoint + "\n" + stateInserts);

  // Insert onSquareClick
  const helperInsertPoint = "// ── Render ────────────────────────────────────────────────────────────────────";
  const helperInserts = `
  // ── Click-to-Move ──────────────────────────────────────────────────────────
  const getMoveOptions = (square: string) => {
    const moves = chess.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }
    const newSquares: Record<string, any> = {};
    moves.map((move: any) => {
      newSquares[move.to] = {
        background:
          chess.get(move.to as any) && chess.get(move.to as any)?.color !== chess.get(square as any)?.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      };
      return move;
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  };

  const onSquareClick = (square: string) => {
    if (gameState.isGameOver) return;
    setLastMovedSquare(null);

    // from square
    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    // to square
    if (moveFrom) {
      const moveResult = chess.move({
        from: moveFrom,
        to: square,
        promotion: 'q',
      });

      if (moveResult) {
        setLastMovedSquare(square);
        const newHistory = [...gameHistory, moveResult.san];
        setGameHistory(newHistory);
        syncBoardFromChess();

        if (gameState.gameMode === 'multiplayer' && currentGameId) {
          saveGameState(newHistory, moveResult.to);
        }
        if (gameState.gameMode === 'ai' && !chess.isGameOver()) {
          setTimeout(makeAIMove, 600);
        }

        if (chess.isGameOver()) {
          setIsTimerRunning(false);
          toast({ title: chess.isCheckmate() ? "Checkmate!" : "Game Over", description: chess.isCheckmate() ? \`\${chess.turn() === 'w' ? 'Black' : 'White'} wins!\` : "Draw." });
        }
      }

      setMoveFrom(null);
      setOptionSquares({});
    }
  };
`;
  content = content.replace(helperInsertPoint, helperInserts + "\n" + helperInsertPoint);

  // Modify render Chessboard
  const boardSearch = `<div className="relative bg-[#5d4037] p-1.5 rounded-lg shadow-2xl w-full max-w-[450px]">`;
  const boardReplace = `<div ref={boardRef} className="relative bg-[#5d4037] p-1.5 rounded-lg shadow-2xl w-full max-w-[450px] aspect-square flex items-center justify-center">`;
  content = content.replace(boardSearch, boardReplace);

  const chessboardSearch = `<Chessboard
                position={fen}
                onPieceDrop={onPieceDrop}
                boardOrientation={isPlayerWhite ? "white" : "black"}
              />`;
  const chessboardReplace = `<div style={{ width: boardWidth }}>
                <Chessboard
                  id="RealChessEngine"
                  position={fen}
                  onPieceDrop={onPieceDrop}
                  onSquareClick={onSquareClick}
                  customSquareStyles={optionSquares}
                  boardOrientation={isPlayerWhite ? "white" : "black"}
                  boardWidth={boardWidth}
                  arePiecesDraggable={false}
                />
              </div>`;
  content = content.replace(chessboardSearch, chessboardReplace);

  fs.writeFileSync(filePath, content);
  console.log(`Successfully patched ${filePath}`);
}

patchFile('./src/components/staff/RealChessEngine.tsx');
