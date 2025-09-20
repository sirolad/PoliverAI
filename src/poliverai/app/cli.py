import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(prog="poliverai", description="PoliverAI CLI")
    sub = parser.add_subparsers(dest="command")

    run = sub.add_parser("runserver", help="Run API server")
    run.add_argument("--host", default="127.0.0.1")
    run.add_argument("--port", type=int, default=8000)

    ingest = sub.add_parser("ingest", help="Ingest one or more files into the RAG store")
    ingest.add_argument("paths", nargs="+", help="File paths to ingest (.txt/.md/.pdf/.docx/.html)")

    args = parser.parse_args()

    if args.command == "runserver":
        import uvicorn

        uvicorn.run("poliverai.app.main:app", host=args.host, port=args.port, reload=True)
    elif args.command == "ingest":
        from ..rag.service import ingest_paths

        paths = [str(Path(p)) for p in args.paths]
        stats = ingest_paths(paths)
        print(stats)
    else:
        parser.print_help()
