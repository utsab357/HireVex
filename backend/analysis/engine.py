import time
import random

class MockAIEngine:
    @staticmethod
    def evaluate(candidate):
        """
        Simulates AI processing of a resume against job requirements.
        Takes 2 seconds to simulate processing time, then returns structured JSON data.
        """
        # Simulate processing delay
        time.sleep(2)
        
        # In a real engine, we'd extract from candidate.resume.parsed_text and candidate.job.requirements
        # For mock, we generate realistic fake data
        
        score = random.randint(70, 98)
        
        strengths = [
            "Strong alignment with target technologies including modern web frameworks.",
            "Demonstrated leadership capabilities in past roles.",
            "Excellent communication skills highlighted throughout resume.",
            "Relevant industry experience matching the job description."
        ]
        
        weaknesses = [
            "Lacks direct experience with the specific cloud provider requested.",
            "Slightly less years of experience than the ideal profile.",
            "Management breadth is limited to smaller teams."
        ]
        
        interview_questions = [
            "Can you describe a time you quickly learned a new cloud technology you hadn't used before?",
            "How would you approach scaling a project with a small team versus the larger teams you might lead here?",
            "What strategies do you use to ensure high code quality under tight deadlines?",
            "Tell us about your strategy for mentoring team members who have more domain knowledge than you do."
        ]
        
        # Pick a subset to make it look slightly random
        random.shuffle(strengths)
        random.shuffle(weaknesses)
        random.shuffle(interview_questions)
        
        return {
            "overall_score": score,
            "explanation": "The candidate shows an overall strong profile that maps well to the core requirements. While they have excellent foundational skills and modern framework experience, there are minor gaps in specific cloud provider knowledge. The candidate's leadership traits suggest they could adapt quickly.",
            "strengths": strengths[:3],
            "weaknesses": weaknesses[:2],
            "interview_questions": interview_questions[:3]
        }
