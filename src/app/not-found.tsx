import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ maxWidth: 600, margin: '15vh auto', padding: 24, textAlign: 'center' }}>
      <p className="eyebrow">ESPAÇO EQUILÍBRIO</p>
      <h1>Vamos encontrar seu caminho?</h1>
      <p className="muted">Essa página não existe. Volte ao início para continuar seu cuidado.</p>
      <Link href="/" className="button button-primary">
        Voltar ao início
      </Link>
    </main>
  );
}
