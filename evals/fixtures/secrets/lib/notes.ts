import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Note = { id: string; title: string; body: string };

export function useNote(id: string) {
  const [note, setNote] = useState<Note | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(`note:${id}`).then((raw) =>
      setNote(raw ? JSON.parse(raw) : null),
    );
  }, [id]);
  return note;
}
