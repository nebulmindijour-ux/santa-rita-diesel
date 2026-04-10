from pydantic import BaseModel, Field


class AddressDTO(BaseModel):
    zip_code: str | None = Field(default=None, max_length=10, description="CEP")
    street: str | None = Field(default=None, max_length=200)
    number: str | None = Field(default=None, max_length=20)
    complement: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100, description="Bairro")
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=2, description="UF")
    country: str = Field(default="BR", max_length=2)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    def is_geocodable(self) -> bool:
        return bool(self.street and self.city and self.state)

    def to_query_string(self) -> str:
        parts: list[str] = []
        if self.street:
            street_part = self.street
            if self.number:
                street_part = f"{street_part}, {self.number}"
            parts.append(street_part)
        if self.district:
            parts.append(self.district)
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        parts.append("Brasil")
        return ", ".join(parts)
