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
    (res / "drawable").mkdir()
    svg = ET.parse(ROOT / "public/assets/bbm/favicon.svg").getroot()
    paths = []
    for element in svg:
        kind = element.tag.rsplit("}", 1)[-1]
        if kind == "path":
            paths.append((element.attrib["fill"], element.attrib["d"]))
        elif kind == "circle":
            cx, cy, radius = (float(element.attrib[key]) for key in ("cx", "cy", "r"))
            paths.append((element.attrib["fill"], f"M{cx-radius},{cy}a{radius},{radius} 0 1,0 {2*radius},0a{radius},{radius} 0 1,0 {-2*radius},0"))
    vector = '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="30" android:viewportHeight="30"><group android:pivotX="15" android:pivotY="15" android:scaleX="0.82" android:scaleY="0.82">'
    for color, data in paths:
        vector += f'<path android:fillColor="{color}" android:pathData="{data}"/>'
    (res / "drawable/brand_mark.xml").write_text(vector + "</group></vector>", encoding="utf-8")
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
    metadata = {"name": "보배드림", "version": "1.0.0", "package": "io.github.bobaekimboae.bobaedream",
                "minAndroid": "8.0", "targetSdk": 35, "bytes": OUT.stat().st_size, "sha256": sha,
                "startUrl": "https://bobaekimboae.github.io/bobaedream/?source=android-app",
                "permissions": ["android.permission.INTERNET"], "deviceExecutionVerified": False}
    OUT.with_name("release.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False))


if __name__ == "__main__":
    main()
