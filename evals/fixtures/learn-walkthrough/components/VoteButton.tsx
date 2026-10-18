'use client';

export function VoteButton(props: {
  roundId: string;
  bookId: string;
  closesAt: string;
}) {
  const closed = new Date(props.closesAt) <= new Date();
  return (
    <button
      disabled={closed}
      onClick={() =>
        fetch(`/api/rounds/${props.roundId}/vote`, {
          method: 'POST',
          body: JSON.stringify({ bookId: props.bookId }),
        })
      }
    >
      {closed ? 'Voting closed' : 'Vote'}
    </button>
  );
}
