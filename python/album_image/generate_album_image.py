from diffusers import StableDiffusionXLPipeline
import torch

model_id = "stabilityai/stable-diffusion-xl-base-1.0"

pipe = StableDiffusionXLPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float16,
    variant="fp16",
    use_safetensors=True
).to("cuda")

prompt = "An illustrated album cover with a background that matches well with a clear atmosphere and a funky atmosphere"
image = pipe(prompt=prompt, num_inference_steps=30, guidance_scale=7.5).images[0]

image.save("album_cover.png")
