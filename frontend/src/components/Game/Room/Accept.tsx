import { Button, Center, Text } from '@mantine/core';
import { Box, Flex } from '@mantine/core';
import React, { useContext, useEffect, useState } from 'react';
import styles from '../Lobby/Lobby.module.css';
import Profile from './Profile';
import { GameContext, PlayerContext } from '@/context/game';
import { useRouter } from 'next/router';
import Canvas from './Canvas';
import request from 'superagent';
import { WsContext } from '@/context/WsContext';

export default function Accept() {
  const game = useContext(GameContext);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const player = useContext(PlayerContext);
  const [status, setStatus] = useState<{ gameStatus: string; error?: Error }>({
    gameStatus: game.gameStatus,
  });
  const socket = useContext(WsContext);

  useEffect(() => {
    let started = false;
    request
      .get('http://localhost:4400/api/v1/game/player/me/currentGame')
      .set('Authorization', `Bearer ${localStorage.getItem('jwtToken')}`)
      .then((res) => {
        if (res.status !== 200) return router.push('/game');
        if (res.body) setStatus({ gameStatus: 'in-game' });
      });
    game.socket
      ?.on('started', (value) => {
        started = true;
        game.config = value;
        game.gameStatus = 'playing';
        setStatus({ gameStatus: 'playing' });
      })
      .on('cancelled', () => router.push('/game'));
    return () => {
      if (!started) game.socket?.emit('leave');
      game.socket?.off('started').off('cancelled');
    };
  }, []);

  useEffect(() => {
    if (game.socket && !game.gameStatus && router.query.id) {
      request
        .get(`http://localhost:4400/api/v1/game/${router.query.id}`)
        .set('Authorization', `Bearer ${localStorage.getItem('jwtToken')}`)
        .then((res) => {
          if (res.status !== 200) return router.push('/game');
          game.conf = res.body.conf;
          game.role =
            player?.username === res.body.host.username ? 'host' : 'guest';
          game.opponent = game.role === 'host' ? res.body.guest : res.body.host;
          game.gameStatus = res.body.status;
          game.gameId = router.query.id as string;
          setStatus({ gameStatus: res.body.status });
        })
        .catch((err) => setStatus({ gameStatus: 'invalid', error: err }));
    }
  }, [router.query.id]);

  return status.gameStatus === 'invalid' ? (
    <Flex justify="center" align="center" h="100%">
      <Text>
        Invalid room {!!status.error && `because: ${status.error.message}`}
      </Text>
    </Flex>
  ) : !game.opponent.username ? (
    <Flex align="center" justify="center" h="100%">
      <Text>Loading game...</Text>
    </Flex>
  ) : status.gameStatus === 'playing' ? (
    <Canvas />
  ) : status.gameStatus === 'in-game' ? (
    <Flex align="center" justify="center" h="100%">
      <Text>Already in game</Text>
    </Flex>
  ) : (
    <Flex align="center" wrap="wrap">
      {game.conf.isInvite && (
        <Text ta="center" display="block" style={{ flexBasis: '100%' }}>
          This is an invite room
        </Text>
      )}
      <Box className={styles.lobby}>
        <Flex
          gap={0}
          direction={{ base: 'column', sm: 'row' }}
          className={styles.profiles}
        >
          <Profile player={player!} />
          <Profile player={game.opponent} />
        </Flex>
        <Flex
          gap="1rem"
          direction="column"
          align="center"
          className={styles.actions}
        >
          <Button
            h="2.7em"
            w="12rem"
            disabled={!game.gameId}
            variant={ready ? 'filled' : 'outline'}
            onClick={() =>
              game.socket?.emit(
                'ready',
                { ready: !ready, gameId: game.gameId }, 
                () => setReady(!ready)
              )
            }
          >
            Ready
          </Button>
          <Button
            h="2.7em"
            w="12rem"
            variant="subtle"
            onClick={() =>
              game.socket?.emit('leave', () => router.push('/game'))
            }
          >
            Leave
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
