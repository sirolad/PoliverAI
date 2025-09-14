import argparse


def main() -> None:
    parser = argparse.ArgumentParser(prog="poliverai", description="PoliverAI CLI")
    sub = parser.add_subparsers(dest="command")

    run = sub.add_parser("runserver", help="Run API server")
    run.add_argument("--host", default="127.0.0.1")
    run.add_argument("--port", type=int, default=8000)

    args = parser.parse_args()

    if args.command == "runserver":
        import uvicorn

        uvicorn.run("poliverai.app.main:app", host=args.host, port=args.port, reload=True)
    else:
        parser.print_help()