#!/usr/bin/env python3
"""
Cria registros tipo CA (Coordenador de Área) na liderança para cada coordenador
regional que ainda não possui um. Lê usuários do Firestore e sincroniza.

Uso: python scripts/sync-coordinators-ca.py [campanha_id]
     Ex: python scripts/sync-coordinators-ca.py 2024-vereador

Requer: firebase-admin instalado e serviceAccount.json acessível.
"""

import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

CAMPANHA_PADRAO = '2024-vereador'


def init_firebase():
    if not firebase_admin._apps:
        cred_env = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if cred_env and os.path.exists(cred_env):
            cred = credentials.Certificate(cred_env)
        else:
            path = input('Caminho para serviceAccount.json: ').strip()
            if not os.path.exists(path):
                print(f'Arquivo não encontrado: {path}')
                sys.exit(1)
            cred = credentials.Certificate(path)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def get_max_id(liderancas_ref, zona):
    """Retorna o maior id numérico nos registros da zona."""
    docs = liderancas_ref.where('_zona', '==', zona).stream()
    max_id = 0
    for doc in docs:
        d = doc.to_dict()
        try:
            val = int(d.get('id', 0))
            if val > max_id:
                max_id = val
        except (ValueError, TypeError):
            pass
    return max_id


def has_ca_record(liderancas_ref, uid):
    """Verifica se já existe registro CA criado por esse coordenador."""
    docs = list(
        liderancas_ref
        .where('_criadoPor', '==', uid)
        .where('tipo', '==', 'CA')
        .limit(1)
        .stream()
    )
    return len(docs) > 0


def main():
    campanha_id = sys.argv[1] if len(sys.argv) > 1 else CAMPANHA_PADRAO

    print('=' * 60)
    print('Sincronizar Coordenadores → Registros CA')
    print(f'Campanha: {campanha_id}')
    print('=' * 60)

    db = init_firebase()

    liderancas_ref = (
        db.collection('campanhas')
        .document(campanha_id)
        .collection('liderancas')
    )

    # Busca todos os usuários com região definida
    users = db.collection('users').stream()
    coords = []
    for doc in users:
        d = doc.to_dict()
        if d.get('region'):
            coords.append({'uid': doc.id, **d})

    if not coords:
        print('Nenhum coordenador com região encontrado.')
        return

    print(f'\nCoordenadores encontrados: {len(coords)}\n')

    criados   = 0
    existentes = 0

    for coord in coords:
        uid    = coord['uid']
        nome   = coord.get('name') or coord.get('email', 'SEM NOME')
        region = coord.get('region', '')
        zona   = coord.get('zona', '')
        email  = coord.get('email', '')

        label = f"{region.upper()} {zona} — {nome}"

        if has_ca_record(liderancas_ref, uid):
            print(f'  ✓ {label} — CA já existe')
            existentes += 1
            continue

        # Calcula próximo ID
        max_id = get_max_id(liderancas_ref, region)
        novo_id = str(max_id + 1).zfill(3)
        primeiro_nome = nome.split()[0] if nome else ''

        ca_doc = {
            'id':         novo_id,
            'nome':       nome.upper(),
            'tipo':       'CA',
            '_zona':      region,
            '_criadoPor': uid,
            '_coordZona': zona,
            '_coordNome': primeiro_nome,
            'status':     'ativo',
            'bairro':     '',
            'telefone':   '',
            'votos':      0,
            'custo_jul':  0,
            'custo_ago':  0,
            'custo_set':  0,
            'custo_out':  0,
            'total':      0,
            'reuniao':    False,
        }

        liderancas_ref.add(ca_doc)
        print(f'  ✅ {label} — CA criado (id={novo_id})')
        criados += 1

    print()
    print('=' * 60)
    print(f'Resultado: {criados} CA(s) criado(s), {existentes} já existia(m).')
    print('=' * 60)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\n❌ Erro: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
