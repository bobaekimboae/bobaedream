"""Build/sign the prototype APK using the official installed Android SDK tools.

No native bridge, third-party Android libraries or Gradle download is required.
The signing key stays outside the repository for future compatible updates.
"""
from pathlib import Path
import hashlib
import json
import os
import secrets
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
APP = Path(__file__).resolve().parent
SDK = Path(os.environ.get("ANDROID_HOME", Path.home() / "AppData/Local/Android/Sdk"))
TOOLS = SDK / "build-tools/36.0.0"
ANDROID = SDK / "platforms/android-36/android.jar"
OUT = ROOT / "public/app/bobaedream.apk"


def run(*args, **kwargs):
    subprocess.run([str(arg) for arg in args], check=True, **kwargs)


def main():
    if not ANDROID.exists() or not TOOLS.exists():
        raise SystemExit("Android SDK platform 36 and build-tools 36.0.0 are required; set ANDROID_HOME.")
    if not shutil.which("javac") or not shutil.which("keytool"):
        raise SystemExit("A JDK with javac and keytool is required.")
    cache = ROOT / "tmp/android-prototype"
    cache.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="build-", dir=cache))
    res = work / "res"
    shutil.copytree(APP / "res", res)
    (res / "mipmap-mdpi").mkdir()
    shutil.copyfile(ROOT / "public/app/icon-192.png", res / "mipmap-mdpi/ic_launcher.png")
    (res / "drawable-nodpi").mkdir()
    # Prepared from icon-adaptive-foreground.svg: both the symbol and outlined
    # wordmark sit inside Android's 66dp safe circle on a 108dp foreground.
    shutil.copyfile(ROOT / "public/app/icon-adaptive-foreground.png", res / "drawable-nodpi/brand_mark.png")
    run(TOOLS / "aapt2.exe", "compile", "--dir", res, "-o", work / "resources.zip")
    run(TOOLS / "aapt2.exe", "link", "-o", work / "unsigned.apk", "-I", ANDROID,
        "--manifest", APP / "AndroidManifest.xml", "--java", work / "gen", work / "resources.zip")
    classes = work / "classes"
    classes.mkdir()
    sources = list((APP / "src").rglob("*.java")) + list((work / "gen").rglob("*.java"))
    run("javac", "-encoding", "UTF-8", "--release", "8", "-classpath", ANDROID, "-d", classes, *sources)
    dex = work / "dex"
    dex.mkdir()
    run("java", "-cp", TOOLS / "lib/d8.jar", "com.android.tools.r8.D8", "--min-api", "26",
        "--lib", ANDROID, "--output", dex, *classes.rglob("*.class"))
    with zipfile.ZipFile(work / "unsigned.apk", "a", compression=zipfile.ZIP_DEFLATED) as package:
        for file in dex.glob("*.dex"):
            package.write(file, file.name)
    run(TOOLS / "zipalign.exe", "-p", "-f", "4", work / "unsigned.apk", work / "aligned.apk")
    signing = Path.home() / ".codex/app-signing"
    signing.mkdir(parents=True, exist_ok=True)
    credentials = signing / "bobaedream-prototype.json"
    key = signing / "bobaedream-prototype.jks"
    if key.exists() != credentials.exists():
        raise SystemExit("Signing key or local credentials are missing; restore the matching pair before rebuilding.")
    if not credentials.exists():
        credentials.write_text(json.dumps({"password": secrets.token_urlsafe(32)}), encoding="utf-8")
    env = {**os.environ, "BBM_SIGNING_PASSWORD": json.loads(credentials.read_text())["password"]}
    if not key.exists():
        run("keytool", "-genkeypair", "-keystore", key, "-alias", "bobaedream-prototype",
            "-keyalg", "RSA", "-keysize", "3072", "-validity", "10000",
            "-dname", "CN=Bobaedream Prototype,OU=Prototype,O=bobaekimboae,C=KR",
            "-storepass:env", "BBM_SIGNING_PASSWORD", "-keypass:env", "BBM_SIGNING_PASSWORD", env=env)
    signer = TOOLS / "lib/apksigner.jar"
    run("java", "-jar", signer, "sign", "--ks", key, "--ks-key-alias", "bobaedream-prototype",
        "--v4-signing-enabled", "false",
        "--ks-pass", "env:BBM_SIGNING_PASSWORD", "--key-pass", "env:BBM_SIGNING_PASSWORD",
        "--out", OUT, work / "aligned.apk", env=env)
    run("java", "-jar", signer, "verify", "--verbose", OUT)
    run(TOOLS / "zipalign.exe", "-c", "-p", "4", OUT)
    badging = subprocess.check_output([str(TOOLS / "aapt.exe"), "dump", "badging", str(OUT)], text=True, encoding="utf-8")
    if "io.github.bobaekimboae.bobaedream" not in badging or "application-label:'보배드림'" not in badging:
        raise SystemExit("Unexpected APK application identity.")
    sha = hashlib.sha256(OUT.read_bytes()).hexdigest()
    OUT.with_suffix(".apk.sha256").write_text(f"{sha}  bobaedream.apk\n", encoding="utf-8")
    version = ET.parse(APP / "AndroidManifest.xml").getroot().attrib["{http://schemas.android.com/apk/res/android}versionName"]
    metadata = {"name": "보배드림", "version": version, "package": "io.github.bobaekimboae.bobaedream",
                "minAndroid": "8.0", "targetSdk": 35, "bytes": OUT.stat().st_size, "sha256": sha,
                "startUrl": "https://bobaekimboae.github.io/bobaedream/?source=android-app",
                "permissions": ["android.permission.INTERNET"], "deviceExecutionVerified": False}
    OUT.with_name("release.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False))


if __name__ == "__main__":
    main()
