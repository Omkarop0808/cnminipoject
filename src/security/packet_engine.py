import time
import random
import uuid
from typing import Dict, Any, List

class PacketEngine:
    """
    Simulates and inspects OSI-Layer Network Packets and Windows Kernel RPC/Registry
    telemetry packets for Computer Networks (CN) demonstration and Deep Packet Inspection (DPI).
    """

    NODES = {
        "client": {"id": "client", "name": "Workstation Client", "ip": "192.168.1.105", "mac": "00:15:5D:8A:2B:11"},
        "gateway": {"id": "gateway", "name": "Corporate Gateway / Router", "ip": "192.168.1.1", "mac": "00:50:56:FE:10:01"},
        "firewall": {"id": "firewall", "name": "Next-Gen Firewall / IDS", "ip": "192.168.1.254", "mac": "00:50:56:FE:20:99"},
        "dns": {"id": "dns", "name": "Enterprise DNS Resolver", "ip": "10.0.0.53", "mac": "00:50:56:AA:33:53"},
        "attacker": {"id": "attacker", "name": "External Threat Actor", "ip": "198.51.100.44", "mac": "52:54:00:12:34:56"},
        "hklm": {"id": "hklm", "name": "Host Kernel HKLM Hive", "ip": "127.0.0.1 (Local)", "mac": "00:00:00:00:00:00"},
        "hkcu": {"id": "hkcu", "name": "User Profile HKCU Hive", "ip": "127.0.0.1 (Local)", "mac": "00:00:00:00:00:00"},
        "lsa": {"id": "lsa", "name": "LSA Credential Vault", "ip": "127.0.0.1 (Local)", "mac": "00:00:00:00:00:00"},
        "canary": {"id": "canary", "name": "Ransomware Canary Tripwire", "ip": "127.0.0.1 (Local)", "mac": "00:00:00:00:00:00"},
        "defender": {"id": "defender", "name": "Windows Defender Agent", "ip": "127.0.0.1 (Local)", "mac": "00:00:00:00:00:00"}
    }

    @classmethod
    def _to_hex_dump(cls, text: str) -> str:
        """Converts text into standard Wireshark-style hex dump representation."""
        raw_bytes = text.encode("utf-8", errors="replace")
        hex_parts = [f"{b:02X}" for b in raw_bytes]
        ascii_parts = [chr(b) if 32 <= b <= 126 else "." for b in raw_bytes]
        
        lines = []
        for i in range(0, len(raw_bytes), 16):
            chunk_hex = " ".join(hex_parts[i:i+16])
            chunk_ascii = "".join(ascii_parts[i:i+16])
            lines.append(f"{i:04X}   {chunk_hex:<48}  |{chunk_ascii}|")
        return "\n".join(lines) if lines else "0000   00                                                |...|"

    @classmethod
    def create_packet(
        cls,
        from_node: str,
        to_node: str,
        protocol: str,
        src_port: int,
        dst_port: int,
        flags: str,
        payload: str,
        threat_level: str = "BENIGN",
        mitre_technique: str = "N/A",
        threat_description: str = "Normal legitimate traffic"
    ) -> Dict[str, Any]:
        src_info = cls.NODES.get(from_node, cls.NODES["client"])
        dst_info = cls.NODES.get(to_node, cls.NODES["gateway"])
        packet_id = f"PKT-{uuid.uuid4().hex[:8].upper()}"

        return {
            "packet_id": packet_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S") + f".{int(time.time()*1000)%1000:03d}Z",
            "from_node": from_node,
            "to_node": to_node,
            "src_name": src_info["name"],
            "dst_name": dst_info["name"],
            "osi_layers": {
                "layer2_datalink": {
                    "src_mac": src_info["mac"],
                    "dst_mac": dst_info["mac"],
                    "ethertype": "0x0800 (IPv4)"
                },
                "layer3_network": {
                    "src_ip": src_info["ip"],
                    "dst_ip": dst_info["ip"],
                    "ttl": random.randint(54, 128),
                    "protocol": "TCP (6)" if "TCP" in protocol or "TLS" in protocol or "HTTP" in protocol else "UDP (17)"
                },
                "layer4_transport": {
                    "src_port": src_port,
                    "dst_port": dst_port,
                    "flags": flags,
                    "sequence_num": random.randint(1000000, 9999999),
                    "window_size": 65535
                },
                "layer7_application": {
                    "protocol": protocol,
                    "payload_length_bytes": len(payload.encode("utf-8")),
                    "payload_preview": payload,
                    "hex_dump": cls._to_hex_dump(payload)
                }
            },
            "security": {
                "threat_level": threat_level,  # BENIGN, SUSPICIOUS, HIGH, CRITICAL
                "mitre_technique": mitre_technique,
                "threat_description": threat_description,
                "dpi_inspected": True
            }
        }

    @classmethod
    def get_sample_stream(cls, count: int = 8) -> List[Dict[str, Any]]:
        packets = []
        templates = [
            ("client", "gateway", "DNS", 53120, 53, "[UDP Query]", "Standard query 0x1f4a A secure-bank-portal.com", "BENIGN", "N/A", "Legitimate DNS query resolution"),
            ("client", "gateway", "TLSv1.3", 53121, 443, "[SYN, ACK]", "Client Hello: TLS_AES_256_GCM_SHA384 cipher negotiation", "BENIGN", "N/A", "Encrypted HTTPS session establishment"),
            ("attacker", "client", "PHISHING_HOOK", 4444, 445, "[PSH, ACK]", "POST /login/harvest HTTP/1.1\\r\\nHost: microso0ft-verify.com\\r\\nCreds: admin:P@ssword123", "CRITICAL", "T1566.002 (Spearphishing Link)", "Credential Harvesting Phishing Link & LSA Hook Probe"),
            ("client", "hkcu", "REG_MUTATION", 512, 135, "[RPC Write]", "RegSetValueExW: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run -> C:\\Temp\\updater.exe", "HIGH", "T1547.001 (Registry Run Keys)", "Host Persistence via User Startup Registry Key"),
            ("attacker", "hklm", "RANSOM_BURST", 6667, 445, "[SMB Write]", "MASS_ENCRYPT_MUTATION: Overwriting HKLM\\System\\CurrentControlSet\\Control\\SafeBoot -> Disabled", "CRITICAL", "T1486 (Data Encrypted for Impact)", "Ransomware Rapid Registry Mutation Burst"),
            ("client", "canary", "CANARY_PROBE", 1024, 0, "[Integrity Read]", "QueryValue: HKLM\\Software\\WinRegHIDS\\CanaryTrap [Hash: a7f8c0...]", "BENIGN", "N/A", "Ransomware canary health heartbeat"),
            ("attacker", "defender", "DEFENSE_EVASION", 9001, 135, "[RPC Tamper]", "RegSetValueEx: HKLM\\Software\\Policies\\Microsoft\\Windows Defender\\DisableAntiSpyware=1", "CRITICAL", "T1562.001 (Disable Security Tools)", "Attempted Windows Defender tamper and evasion"),
            ("hklm", "lsa", "CIA_HASH_AUDIT", 0, 0, "[Cryptographic Seal]", "CIA SHA-256 Block #14 Sealed. Merkle Root: 3e8b4... All hashes matched.", "BENIGN", "N/A", "CIA Triad Cryptographic State Verification")
        ]

        selected = random.sample(templates, min(count, len(templates)))
        for item in selected:
            packets.append(cls.create_packet(
                from_node=item[0],
                to_node=item[1],
                protocol=item[2],
                src_port=item[3],
                dst_port=item[4],
                flags=item[5],
                payload=item[6],
                threat_level=item[7],
                mitre_technique=item[8],
                threat_description=item[9]
            ))
        return packets

    @classmethod
    def generate_attack_scenario(cls, attack_type: str) -> List[Dict[str, Any]]:
        """Generates a realistic multi-step attack packet trace for hackathon demonstration."""
        if attack_type == "PHISHING":
            return [
                cls.create_packet("attacker", "dns", "DNS", 59001, 53, "[UDP]", "Query A login.micros0ft-auth.xyz (Typosquatted domain)", "SUSPICIOUS", "T1566.002", "Punycode/Typosquatted domain resolution"),
                cls.create_packet("attacker", "client", "HTTP", 80, 59002, "[PSH, ACK]", "GET /phish/fakesso.html -> Injects fake MFA credential dialog", "HIGH", "T1566.002", "Fake authentication prompt delivered"),
                cls.create_packet("client", "lsa", "LSA_HOOK", 1045, 0, "[Local Hook]", "Injecting credential filter DLL to HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa", "CRITICAL", "T1556.002", "LSA Credential Provider Hooking Attempt")
            ]
        elif attack_type == "RANSOMWARE":
            return [
                cls.create_packet("attacker", "client", "SMB", 445, 59100, "[SMB2 Write]", "Dropper payload dropped in C:\\Windows\\Temp\\cryptolocker.tmp", "HIGH", "T1204.002", "Malicious executable dropped"),
                cls.create_packet("client", "canary", "CANARY_TRIP", 59101, 0, "[Reg Delete]", "Mutating Canary Tripwire: HKLM\\Software\\WinRegHIDS\\CanaryTrap", "CRITICAL", "T1486", "Ransomware canary tripwire breached!"),
                cls.create_packet("client", "hklm", "BURST_ENCRYPT", 59102, 0, "[Mass Mutation]", "42 Registry keys modified within 350ms (vssadmin delete shadows)", "CRITICAL", "T1486 / T1490", "Shadow Copy deletion & mass mutation detected - Lockdown engaged")
            ]
        elif attack_type == "CIA_TAMPER":
            return [
                cls.create_packet("attacker", "hklm", "REG_TAMPER", 59200, 135, "[Direct Memory Edit]", "Direct modification of System Hive without Ledger transaction log", "HIGH", "T1565.001", "Unauthorized registry state modification outside security ledger"),
                cls.create_packet("hklm", "defender", "HASH_MISMATCH", 0, 0, "[Ledger Verify]", "Block #12 prev_hash mismatch: expected a4f1..., found e889...", "CRITICAL", "T1565.001", "CIA Triad Integrity Breach: Cryptographic Hash-Chain Tamper Detected")
            ]
        else:
            return cls.get_sample_stream(4)

packet_engine = PacketEngine()
