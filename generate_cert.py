#!/usr/bin/env python3
"""SSL Certificate Generator - Hospital Management System v5.0"""

import os
import ipaddress
from datetime import datetime, timedelta
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

def generate_ssl_certificate():
    print("=" * 55)
    print("  SSL CERTIFICATE GENERATOR")
    print("=" * 55)
    certs_dir = os.path.join(os.path.dirname(__file__), 'certs')
    os.makedirs(certs_dir, exist_ok=True)
    passphrase = b'hospital-ssl-passphrase-2026'

    print("[1/4] Generating RSA private key...")
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=4096, backend=default_backend())

    print("[2/4] Creating certificate...")
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "KE"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Safari Softwares"),
        x509.NameAttribute(NameOID.COMMON_NAME, "Hospital Management System"),
    ])
    
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now())
        .not_valid_after(datetime.now() + timedelta(days=3650))
        .add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                x509.IPAddress(ipaddress.IPv4Address("192.168.1.10")),
            ]),
            critical=False,
        )
        .sign(private_key, hashes.SHA256(), default_backend())
    )

    print("[3/4] Saving files...")
    with open(os.path.join(certs_dir, 'server.key'), 'wb') as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(passphrase)
        ))
    with open(os.path.join(certs_dir, 'server.cert'), 'wb') as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    with open(os.path.join(certs_dir, 'server.passphrase'), 'w') as f:
        f.write(passphrase.decode())

    print("[4/4] SSL Certificate generated successfully!")
    print()

if __name__ == '__main__':
    generate_ssl_certificate()