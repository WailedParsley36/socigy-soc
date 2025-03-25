# Implementace mikroservisní architektury a dynamického pluginového ekosystému pro robustní sociální platformu s využitím orchestrace Kubernetes

Tato práce představuje návrh a implementaci inovativní sociální platformy Socigy, která řeší současné nedostatky existujících řešení a poskytuje flexibilní základ pro budoucí inovace v oblasti sociálních interakcí v digitálním prostoru.

## Klíčové funkce

- Modulární architektura s pluginovým systémem založeným na WebAssembly
- Pokročilé autentizační mechanismy s podporou FIDO2 a Passkeys
- Multiplatformní řešení s optimalizovaným UI pro desktop i mobilní zařízení
- Transparentní algoritmy pro distribuci a personalizaci obsahu
- Graduální přechodový model pro různé věkové kategorie uživatelů
- Ekonomický model podporující tvůrce obsahu

## Technologie

- Kubernetes pro orchestraci kontejnerizovaných aplikací
- Consul pro Service Mesh a API Gateway
- PostgreSQL s Spillo a Patroni pro vysokou dostupnost databáze
- HashiCorp Vault pro správu tajemství a šifrovacích klíčů
- React Native Expo pro mobilní aplikace
- Next.js pro webovou aplikaci
- WebAssembly pro pluginový systém
- Cloudflare R2 CDN pro distribuci statického obsahu
- Grafana, Loki a Prometheus pro monitoring a logování

## Struktura projektu

- `/docs.pdf` - Dokumentace projektu
- `/deployment` - Konfigurační soubory pro Kubernetes
- `/schemas` - Schémata
- `/server` - Zdrojové kódy jednotlivých mikroslužeb
- `/client/web` - Zdrojové kódy pro webovou aplikaci
- `/client/native` - Zdrojové kódy pro mobilní aplikaci s implementací pluginového systému a passkeys modulu
- `/client/native/app-old-iteration` - Zdrojové kódy pro přechozí iteraci mobilní aplikace s implementací pluginového systému a passkeys modulu v jedné aplikaci
- `/db-scripts` - Databázové skripty s tabulkami
- `/plugins` - Vlastní Rust WASM UI Framework

## Licence

Tento projekt je licencován pod [Proprietární licencí](./LICENSE).

## Autor

Patrik Stohanzl

## Poděkování

Děkuji RNDr. Janu Koupilovi, PhD. za vedení této práce a DELTA - Střední škola informatiky a ekonomie za podporu během studia.
