import './globals.css';
import './workflow.css';
export const metadata = {
  title:'ActionWitness — Shared workflows with proof',
  description:'A multi-user GenLayer workflow for immutable policies, hash-pinned evidence, native GEN escrow, and validator-checked settlement.',
  applicationName:'ActionWitness',
  robots:{index:false,follow:false}
};
export default function RootLayout({children}) {return <html lang="en"><body>{children}</body></html>}
