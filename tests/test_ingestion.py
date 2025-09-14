def test_placeholder_ingestion_imports() -> None:
    import poliverai.ingestion.readers.pdf_reader as _  # noqa: F401
    import poliverai.ingestion.readers.docx_reader as _  # noqa: F401
    import poliverai.ingestion.readers.html_reader as _  # noqa: F401