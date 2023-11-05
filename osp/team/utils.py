from team.models import TeamMember


def is_teammember(team_id, user_id):
    if (len(TeamMember.objects.filter(team__id=team_id, member=user_id).values_list('id')) == 0):
        return False
    else:
        return True
