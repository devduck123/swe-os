import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { useNote } from '../../lib/notes';

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useNote(id);
  if (!note) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>{note.title}</Text>
      <Text style={{ marginTop: 12, fontSize: 16, lineHeight: 24 }}>
        {note.body}
      </Text>
    </ScrollView>
  );
}
