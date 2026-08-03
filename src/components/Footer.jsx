const CONTACT_EMAIL = 'info@aarebogemagic.ch';

export default function Footer() {
  return (
    <footer>
      <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
      <span style={{ margin: '0 1rem', color: '#999' }}>|</span>
      <a href="/privacy.html">Privacy</a>
      <span style={{ margin: '0 1rem', color: '#999' }}>|</span>
      <a href="/admin.html">Admin</a>
    </footer>
  );
}
