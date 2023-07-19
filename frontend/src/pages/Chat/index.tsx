import { useContext, useEffect, useState } from 'react';
import { Button, Container, Flex, Grid } from '@mantine/core';
import { useElementSize, useMediaQuery } from '@mantine/hooks';
import ChatNav from '@/components/Chat/ChatNav';
// import MainChat from '@/components/Chat/ChatMassages';
// import UserInfo from '@/components/Chat/ChatInfo';
import ChatRoom from '@/components/Chat/ChatRoom';
import { UserContext } from '@/context/user';
import Styles from './Chat.module.css';
import withAuth from '@/pages/lib/withAuth';
import { createContext } from 'react';
import { io } from 'socket.io-client';

// export const socketContext = createContext(
//   io('localhost:4400/chat', {
//     // auth: {
//     //   token: localStorage.getItem('jwtToken'),
//     // },
//     autoConnect: false
//   }
// ));

function Chat() {
  // const socket = useContext(socketContext);
  // useEffect(()=>{
  //   socket.connect();
  //   return ()=>{
  //     socket.disconnect();
  //   }
  // }, []);


  return (
    <Flex className={Styles.chat} gap={0} align="stretch">
      <ChatNav/>
      <ChatRoom />
      {/* <UserInfo width="25%" /> */}
    </Flex>
  );
}

export default withAuth(Chat);
