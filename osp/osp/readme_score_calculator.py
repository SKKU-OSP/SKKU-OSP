"""Python port of ReadmeScoreCalculator.java."""


def calculate_total(
    clarity: int,
    readability: int,
    reproducibility_code: int,
    reproducibility_result: int,
    visual: int,
    license: int,
    collaboration: int,
) -> float:
    core = clarity + readability + min(reproducibility_code + reproducibility_result, 4)
    bonus = visual + license + collaboration
    return min(core + bonus, 15)


def to_grade(total: float) -> str:
    if total > 12:
        return "A+"
    if total >= 9:
        return "A"
    if total >= 6:
        return "B"
    if total >= 3:
        return "C"
    return "D"