package com.hhkungfu.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.hhkungfu.backend.config.CloudinaryProperties;

@EnableScheduling
@SpringBootApplication
@EnableConfigurationProperties(CloudinaryProperties.class)
public class HhkungfuApplication {

	public static void main(String[] args) {
		SpringApplication.run(HhkungfuApplication.class, args);
	}

}
